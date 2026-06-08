import { create } from "zustand";
import { api } from "../lib/api";

export interface Chat extends PdfInfo {
  id: string;
  status: string;
}

export interface PdfInfo {
  fileName: string;
  fileUrl: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatStore {
  chatHistory: Chat[];
  selectedChat: Chat | null;
  chats: Chat[];
  pdfInfo: PdfInfo;
  sessionIds: Record<string, string>; // documentId -> sessionId

  setChatHistory: (chatHistory: Chat[]) => void;
  setSelectedChat: (selectedChat: Chat | null) => void;
  setChats: (chats: Chat[]) => void;
  setPdfInfo: (pdfInfo: PdfInfo) => void;

  addChatToHistory: (chat: Chat) => void;
  removeChatFromHistory: (chatId: string) => void;

  // Services
  uploadPdf: (file: File, onSuccess: (id: string) => void) => Promise<void>;
  getChatDocuments: () => Promise<void>;

  // Session management
  createSession: (documentId: string) => Promise<string>;
  getOrCreateSession: (documentId: string) => Promise<string>;
  querySession: (
    sessionId: string,
    query: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => Promise<void>;
  getSessionMessages: (sessionId: string) => Promise<ChatMessage[]>;
  getSessions: (
    documentId: string
  ) => Promise<Array<{ id?: string; sessionId?: string }>>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chatHistory: [],
  selectedChat: null,
  chats: [],
  pdfInfo: {
    fileName: "",
    fileUrl: "",
  },
  sessionIds: {},

  setChatHistory: (chatHistory) => set({ chatHistory }),
  setSelectedChat: (selectedChat) => set({ selectedChat }),
  setChats: (chats) => set({ chats }),
  setPdfInfo: (pdfInfo) => set({ pdfInfo }),

  addChatToHistory: (chat) => {
    const { chatHistory } = get();
    set({ chatHistory: [chat, ...chatHistory] });
  },

  removeChatFromHistory: (chatId) => {
    const { chatHistory } = get();
    set({ chatHistory: chatHistory.filter((chat) => chat.id !== chatId) });
  },

  uploadPdf: async (file: File, onSuccess: (id: string) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/chat/upload", formData);
      set({
        pdfInfo: {
          fileName: response.data.document.filename,
          fileUrl: response.data.fileUrl,
        },
        chatHistory: [
          {
            id: response.data.document.id,
            fileName: response.data.document.filename,
            fileUrl: response.data.document.fileUrl,
            status: response.data.document.status,
          },
          ...get().chatHistory,
        ],
        selectedChat: {
          id: response.data.document.id,
          fileName: response.data.document.filename,
          fileUrl: response.data.fileUrl,
          status: response.data.document.status,
        },
      });
      onSuccess(response.data.document.id);
    } catch (error) {
      console.error(error);
    }
  },

  getChatDocuments: async () => {
    try {
      const response = await api.get("/chat/documents");

      set({
        chatHistory: response.data.documents.map(
          (document: {
            id: string;
            filename: string;
            fileUrl: string;
            status: string;
          }): Chat => ({
            id: document.id,
            fileName: document.filename,
            fileUrl: document.fileUrl,
            status: document.status,
          })
        ),
      });
    } catch (error) {
      console.error(error);
    }
  },

  createSession: async (documentId: string) => {
    try {
      const response = await api.post("/chat/session", { documentId });
      const sessionId = response.data.sessionId || response.data.id;

      set((state) => ({
        sessionIds: {
          ...state.sessionIds,
          [documentId]: sessionId,
        },
      }));

      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  getOrCreateSession: async (documentId: string) => {
    const { sessionIds, createSession } = get();

    // Check if session already exists for this document
    if (sessionIds[documentId]) {
      return sessionIds[documentId];
    }

    // Try to get existing sessions for this document
    try {
      const sessions = await get().getSessions(documentId);
      if (sessions && sessions.length > 0) {
        // Use the first session (or most recent one)
        const sessionId = sessions[0].id || sessions[0].sessionId;
        if (sessionId) {
          set((state) => ({
            sessionIds: {
              ...state.sessionIds,
              [documentId]: sessionId,
            },
          }));
          return sessionId;
        }
      }
    } catch (error) {
      console.error("Error getting sessions:", error);
    }

    // Create a new session if none exists
    return await createSession(documentId);
  },

  querySession: async (
    sessionId: string,
    query: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ sessionId, query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              } else if (parsed.text) {
                onChunk(parsed.text);
              } else if (typeof parsed === "string") {
                onChunk(parsed);
              }
            } catch {
              // If it's not JSON, treat it as plain text
              if (data.trim()) {
                onChunk(data);
              }
            }
          } else if (line.trim()) {
            // Handle plain text chunks
            onChunk(line);
          }
        }
      }
    } catch (error) {
      console.error("Error querying session:", error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },

  getSessionMessages: async (sessionId: string) => {
    try {
      const response = await api.get(`/chat/session/${sessionId}/messages`);
      const messages = response.data.messages || response.data;

      return messages.map(
        (msg: {
          id?: string;
          role?: string;
          type?: string;
          content?: string;
          text?: string;
          timestamp?: string | Date;
        }) => ({
          id: msg.id || `${msg.timestamp}-${Math.random()}`,
          role: (msg.role || (msg.type === "ai" ? "assistant" : "user")) as
            | "user"
            | "assistant",
          content: msg.content || msg.text || "",
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        })
      );
    } catch (error) {
      console.error("Error getting session messages:", error);
      return [];
    }
  },

  getSessions: async (documentId: string) => {
    try {
      const response = await api.get(`/chat/sessions/${documentId}`);
      return response.data.sessions || response.data || [];
    } catch (error) {
      console.error("Error getting sessions:", error);
      return [];
    }
  },
}));
