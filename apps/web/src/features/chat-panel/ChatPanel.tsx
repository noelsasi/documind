import React, { useState, useRef, useEffect } from "react";
import { Spinner } from "@fluentui/react-components";
import { Send24Regular } from "@fluentui/react-icons";
import { useUser } from "@stackframe/react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../store/chatStore";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

// Returns true if this message starts a new group (different sender than previous)
function isGroupStart(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  return messages[index].type !== messages[index - 1].type;
}

function isGroupEnd(messages: Message[], index: number): boolean {
  if (index === messages.length - 1) return true;
  return messages[index].type !== messages[index + 1].type;
}

function AiAvatar() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        color: "white",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(124,58,237,0.35)",
      }}
    >
      AI
    </div>
  );
}

export const ChatPanel: React.FC = () => {
  const user = useUser();
  const params = useParams<{ chatId: string }>();
  const documentId = params.chatId;
  const { getOrCreateSession, querySession, getSessionMessages, selectedChat } =
    useChatStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentAiMessageRef = useRef<string>("");
  const messageIdCounterRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || !documentId || isLoading) return;

    messageIdCounterRef.current += 1;
    const userMessageId = `user-${messageIdCounterRef.current}`;
    const aiMessageId = `ai-${messageIdCounterRef.current}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, type: "user", content: messageText, timestamp: new Date() },
      { id: aiMessageId, type: "ai", content: "", timestamp: new Date(), streaming: true },
    ]);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
    setIsLoading(true);
    currentAiMessageRef.current = "";

    try {
      const sessionId = await getOrCreateSession(documentId);

      await querySession(
        sessionId,
        messageText,
        (chunk: string) => {
          currentAiMessageRef.current += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: currentAiMessageRef.current }
                : msg
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, streaming: false } : msg
            )
          );
          setIsLoading(false);
        },
        (error: Error) => {
          console.error("Error querying session:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: msg.content || "Sorry, I encountered an error. Please try again.",
                    streaming: false,
                  }
                : msg
            )
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const sessionId = await getOrCreateSession(documentId);
        if (cancelled) return;
        const sessionMessages = await getSessionMessages(sessionId);
        if (cancelled) return;
        setMessages(
          sessionMessages.map((msg) => ({
            id: msg.id,
            type: msg.role === "assistant" ? "ai" : "user",
            content: msg.content,
            timestamp: msg.timestamp,
          }))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    };

    loadMessages();
    return () => { cancelled = true; };
  }, [documentId, getOrCreateSession, getSessionMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const userInitial = (user?.displayName || user?.primaryEmail || "U")[0].toUpperCase();

  return (
    <div
      style={{
        flex: "0 0 42%",
        display: "flex",
        flexDirection: "column",
        background: "white",
        borderLeft: "1px solid #e5e7eb",
        minWidth: 320,
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid #f0f0f0",
          background: "white",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {selectedChat?.fileName || "Document chat"}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
          Ask anything about this document
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          background: "#fafafa",
        }}
      >
        {isLoadingMessages ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Spinner size="medium" />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: "#ede9fe",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
                Start the conversation
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, maxWidth: 260 }}>
                Ask a question, request a summary, or extract specific information from this document.
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const groupStart = isGroupStart(messages, index);
              const groupEnd = isGroupEnd(messages, index);
              const isUser = message.type === "user";

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    flexDirection: isUser ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 8,
                    marginBottom: groupEnd ? 14 : 3,
                  }}
                >
                  {/* Avatar: only on last message of a group */}
                  {!isUser && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {groupEnd ? <AiAvatar /> : null}
                    </div>
                  )}
                  {isUser && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {groupEnd ? (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          {userInitial}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "9px 13px",
                      fontSize: 14,
                      lineHeight: 1.55,
                      borderRadius: isUser
                        ? groupStart && groupEnd
                          ? 16
                          : groupStart
                          ? "16px 16px 4px 16px"
                          : groupEnd
                          ? "4px 16px 16px 16px"
                          : "4px 16px 16px 4px"
                        : groupStart && groupEnd
                        ? 16
                        : groupStart
                        ? "16px 16px 16px 4px"
                        : groupEnd
                        ? "4px 16px 16px 16px"
                        : "4px 16px 16px 4px",
                      background: isUser ? "#7c3aed" : "white",
                      color: isUser ? "white" : "#111827",
                      boxShadow: isUser
                        ? "0 1px 3px rgba(124,58,237,0.25)"
                        : "0 1px 3px rgba(0,0,0,0.06)",
                      border: isUser ? "none" : "1px solid #f0f0f0",
                      wordBreak: "break-word",
                    }}
                  >
                    {message.type === "ai" && !message.content && message.streaming ? (
                      <Spinner size="tiny" />
                    ) : (
                      <span className={message.streaming && message.content ? "streaming-cursor" : ""}>
                        {message.content}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid #f0f0f0",
          background: "white",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "8px 10px 8px 14px",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#111827",
              resize: "none",
              fontFamily: "inherit",
              height: 40,
              maxHeight: 120,
              overflowY: "auto",
              paddingTop: 10,
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "none",
              background: !inputValue.trim() || isLoading ? "#e5e7eb" : "#7c3aed",
              color: !inputValue.trim() || isLoading ? "#9ca3af" : "white",
              cursor: !inputValue.trim() || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
          >
            {isLoading ? <Spinner size="tiny" /> : <Send24Regular style={{ fontSize: 16 }} />}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 6 }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
