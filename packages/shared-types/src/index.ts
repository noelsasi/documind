// Shared types between apps/web and apps/api

export interface Document {
  id: string;
  filename: string;
  fileSize: number;
  fileUrl: string;
  s3Key: string;
  mimeType?: string;
  status: "not_started" | "processing" | "completed" | "failed";
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  documentId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sessionId: string;
}

export interface UploadDocumentResponse {
  message: string;
  document: Pick<Document, "id" | "filename" | "fileUrl" | "status" | "createdAt">;
  user: { id: string; email: string };
}

export interface QueryChatRequest {
  sessionId: string;
  question: string;
}

export interface QueryChatResponse {
  answer: string;
  sessionId: string;
}
