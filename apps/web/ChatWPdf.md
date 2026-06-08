# ChatWithPDF — System Overview

A full-stack AI application that lets users upload PDFs and have a real-time streaming conversation with the document using RAG (Retrieval-Augmented Generation).

---

## What it does

1. User uploads a PDF
2. The system processes it in the background — extracts text, chunks it, embeds it into a vector database
3. User asks questions about the document
4. The system finds the most relevant chunks, feeds them to an LLM, and streams the answer back in real time

---

## Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Zustand, FluentUI, Vite |
| Backend API | Node.js, Express, TypeScript, AWS Lambda |
| Ingestion Worker | Python 3.12, AWS Lambda |
| Database | PostgreSQL on Neon (Prisma ORM) |
| Vector Database | Pinecone |
| Embeddings | Pinecone Inference (`llama-text-embed-v2`) |
| LLM | OpenAI `gpt-4.1-mini` with streaming |
| Storage | AWS S3 |
| Async Trigger | AWS SNS |
| Auth | Stack Auth (JWT via cookies) |

---

## Architecture

```
Browser (React)
     │
     │  REST + Server-Sent Events
     ▼
Express API  ──── PostgreSQL (Neon)
   (Lambda)  ──── Pinecone (vector search)
     │        ──── OpenAI (LLM streaming)
     │
     │  SNS message on upload
     ▼
Python Ingestion Lambda
     ├── S3 (download PDF)
     ├── PyPDF2 (extract text)
     ├── Chunking (800 chars, 150 overlap)
     └── Pinecone (embed + upsert vectors)
```

---

## End-to-End Flow

### Upload

1. User picks a PDF on the landing page
2. Frontend POSTs to `/api/chat/upload` as multipart form data
3. Backend saves it to **S3**, creates a `Document` row in PostgreSQL with status `"processing"`, then publishes an **SNS message**
4. The **Python Lambda** picks up the SNS event asynchronously:
   - Downloads PDF from S3
   - Extracts text page by page with PyPDF2
   - Splits into 800-character chunks with 150-char overlap
   - Embeds each chunk via Pinecone Inference
   - Upserts vectors into Pinecone under the user's namespace (`user_{userId}`)
   - Updates document status to `"completed"`
5. Frontend shows a status badge on the PDF viewer — goes from "processing" to "completed"

### Chat

1. When the PDF viewer page loads, frontend calls `getOrCreateSession(documentId)` → gets or creates a `ChatSession` in the DB
2. Previous messages are loaded from `/api/chat/session/:id/messages`
3. User types a question and hits send
4. Frontend calls `/api/chat/query` using native `fetch` (not axios) to handle streaming
5. Backend:
   - Embeds the user query with Pinecone Inference
   - Runs a semantic search (top 5 matches) in the user's Pinecone namespace
   - Builds a system prompt with the retrieved context
   - Streams `gpt-4.1-mini` response as **Server-Sent Events**
6. Frontend reads the stream chunk by chunk and updates the UI in real time
7. Once `[DONE]` arrives, the full response is persisted to the DB

---

## Frontend Architecture

### State Management — Zustand

Single store (`chatStore.ts`) handles everything:

- `chatHistory` — list of all uploaded documents
- `selectedChat` — currently active document
- `sessionIds` — map of `documentId → sessionId` (avoids creating duplicate sessions)
- `pdfInfo` — current PDF metadata (name + URL)

### Component Structure

```
App (Router + Auth providers)
└── AppLayout (sidebar + outlet)
    ├── Header (logo, New Chat button, user auth)
    ├── Sidebar (document list)
    └── Pages
        ├── LandingPage → PdfUpload component
        └── PdfViewerPage
            ├── PDFViewer (react-pdf, zoom/page controls)
            └── ChatPanel (messages, input, streaming)
```

### Streaming Implementation

The chat uses native `fetch` with `response.body.getReader()` instead of axios because axios doesn't support streaming well. Lines prefixed with `data: ` are parsed, chunks are accumulated in a React ref, and state is updated on every chunk so the UI re-renders progressively.

### Routing

```
/                   → LandingPage (upload a PDF)
/chat/:chatId       → PdfViewerPage (PDF + Chat split view)
/todos              → TodosPage (secondary feature)
/handler/*          → Stack Auth OAuth redirect handler
```

---

## Backend Architecture

### API — Express on Lambda

Authentication middleware runs on every route: it reads the `stack-access` cookie, validates the JWT against Stack Auth's JWKS endpoint, and attaches `userId` to the request.

**Chat routes flow:**

- `POST /upload` → multer parses file → S3 upload → DB insert → SNS publish
- `POST /query` → Pinecone embed → Pinecone search → build prompt → stream OpenAI → persist to DB
- `POST /session` / `GET /sessions/:docId` → session lifecycle management

### Database Models

```
Document          — one per PDF upload (has status lifecycle)
  └── ChatSession — one per conversation (can have multiple per document)
        └── ChatMessage — individual messages (role: user | assistant)
```

### Multi-tenancy

Every Pinecone operation uses a namespace of `user_{userId}`. This means each user's vectors are isolated — searching in one user's namespace never touches another user's data.

---

## Key Design Decisions

**Why SNS for ingestion?**
PDF processing (extract → chunk → embed → upsert) can take 10-30 seconds for large files. Doing it synchronously in the upload endpoint would time out on Lambda (API Gateway has a 29s limit). SNS decouples it — the upload returns immediately and processing happens async.

**Why two separate services (Node.js + Python)?**
PDF text extraction and ML embedding workflows are better suited to Python (PyPDF2, numpy ecosystem). The API layer is better in TypeScript for type safety and fast JSON handling. Keeping them separate also means independent scaling and deployment.

**Why native fetch for streaming instead of axios?**
Axios buffers the full response before resolving. For Server-Sent Events you need access to the raw stream as it arrives, which requires the Streams API (`response.body.getReader()`). Native fetch exposes this directly.

**Why Zustand over Redux?**
The state shape is simple — a few lists and selected items. Zustand gives you a store with zero boilerplate and works well with React 19's concurrent features. Redux would be overkill here.

**Why per-user Pinecone namespaces instead of metadata filtering?**
Namespace-level isolation is faster (Pinecone searches only the namespace, not the full index) and cleaner for multi-tenancy. Filtering by userId metadata would scan all vectors and apply a post-filter.

---

## Interview Talking Points

- **RAG pipeline**: Describe the upload → chunk → embed → store → retrieve → generate loop clearly
- **Async processing**: Why SNS? What happens if ingestion fails? (status = "failed", surfaced in UI)
- **Streaming**: SSE vs WebSockets — SSE is simpler, unidirectional, works over HTTP/2, sufficient for chat
- **Auth**: JWT in a cookie (httpOnly) prevents XSS token theft vs localStorage
- **Scalability**: Lambda scales automatically per request; Pinecone namespaces isolate users without DB joins
- **Chunking strategy**: 800 chars with 150-char overlap preserves sentence context across chunk boundaries
- **Session model**: Separating `ChatSession` from `Document` allows multiple conversations per PDF

---

## Local Development

```bash
# Frontend
cd chatwpdf-fe
npm install
npm run dev          # Vite dev server, proxies /api → localhost:8080

# Backend
cd chatwpdf-services/chatwpdf-be
npm install
npx prisma generate
npm run dev          # Express server on :8080

# Ingestion (test locally)
cd chatwpdf-services/chatwpdf-ingestion
pip install -r requirements.txt
python handler.py    # Triggered by SNS in production
```

**Required env vars:**
- `DATABASE_URL` — Neon PostgreSQL connection string
- `OPENAI_API_KEY`
- `PINECONE_API_KEY` + `PINECONE_INDEX_NAME`
- `AWS_S3_BUCKET` + `SNS_TOPIC_ARN`
- `VITE_STACK_PROJECT_ID` + `VITE_STACK_PUBLISHABLE_CLIENT_KEY` (frontend)
