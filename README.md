# DocuMind

AI-powered document intelligence platform. Upload any PDF, ask questions in plain language, and get precise answers backed by the source — with streaming responses and per-user document history.

---

## Features

- **Document Q&A** — Chat with any PDF using RAG (Retrieval-Augmented Generation). Answers are grounded in the document, not hallucinated.
- **Streaming responses** — AI replies stream token-by-token with a live cursor indicator.
- **Per-user isolation** — Documents and chat sessions are scoped to the authenticated user. Each user only sees their own uploads.
- **Session memory** — Conversation history is persisted per document. Pick up where you left off across page reloads.
- **Async ingestion pipeline** — Uploads return immediately. PDF processing (text extraction → chunking → vector embedding) happens asynchronously via SNS + Lambda.
- **Processing status** — Documents show a live "Processing / Ready" status pill while ingestion runs.
- **Auth** — Email/password and OAuth via Stack Auth (cookie-based sessions).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
│  apps/web  —  Vite · React 19 · FluentUI · Zustand · Stack Auth│
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP / SSE (streaming)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API  (apps/api)                               │
│  Express · TypeScript · Serverless Framework → AWS Lambda       │
│  Auth middleware: Stack Auth JWT validation                     │
│  ORM: Prisma → PostgreSQL (RDS / Neon)                         │
│                                                                 │
│  POST /api/chat/upload   → S3 upload → SNS publish             │
│  GET  /api/chat/documents → list user docs                      │
│  POST /api/chat/session  → create/get chat session              │
│  POST /api/chat/query    → RAG query → SSE stream               │
│  GET  /api/chat/session/:id/messages → history                  │
└──────────────┬──────────────────────────────────────────────────┘
               │  S3 upload event → SNS → Lambda trigger
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Ingestion Service  (services/ingestion)            │
│  Python 3.12 · Serverless Framework → AWS Lambda               │
│  Trigger: SNS topic  doc-ingestion-topic                        │
│                                                                 │
│  1. Pull PDF from S3                                            │
│  2. Extract text  (PyPDF2)                                      │
│  3. Chunk text    (800 tokens, 150 overlap)                     │
│  4. Embed chunks  (OpenAI text-embedding-3-small)               │
│  5. Upsert vectors → Pinecone                                   │
│  6. Update document status → PostgreSQL                         │
└─────────────────────────────────────────────────────────────────┘

External services
  PostgreSQL  — user data, documents, sessions, messages
  AWS S3      — raw PDF storage
  AWS SNS     — decouples upload from ingestion
  Pinecone    — vector store for semantic search
  OpenAI      — embeddings (text-embedding-3-small) + chat (GPT-4o)
  Stack Auth  — authentication & session management
```

### Data model

```
Document
  id · filename · fileUrl · s3Key · status · userId · createdAt

ChatSession
  id · userId · documentId → Document

ChatMessage
  id · role (user|assistant) · content · sessionId → ChatSession
```

### Request flow — asking a question

```
User types question
  → POST /api/chat/query  { sessionId, query }
  → API fetches top-k vectors from Pinecone (semantic search)
  → API builds prompt: [context chunks] + [chat history] + [question]
  → Streams GPT-4o response back as SSE
  → Frontend appends chunks in real-time
  → On [DONE], message persisted to PostgreSQL
```

---

## Monorepo structure

```
documind/
├── apps/
│   ├── api/                  # Express API — deployed as AWS Lambda
│   │   ├── src/
│   │   │   ├── controllers/  # chatController, todoController
│   │   │   ├── middlewares/  # auth, error, SNS
│   │   │   ├── routes/
│   │   │   └── config/       # database, S3 clients
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── serverless.yml
│   │
│   └── web/                  # React SPA
│       ├── src/
│       │   ├── pages/        # LandingPage, HomePage, PdfViewerPage
│       │   ├── layout/       # AppLayout (sidebar + top bar)
│       │   ├── features/
│       │   │   ├── chat-panel/   # ChatPanel + styles
│       │   │   ├── pdf-viewer/   # PDFViewer with floating toolbar
│       │   │   └── pdf-upload/   # PdfUpload (legacy, superseded by UploadModal)
│       │   ├── components/   # UploadModal, SignupPopup
│       │   ├── store/        # chatStore (Zustand)
│       │   └── lib/          # api.ts (axios), stack.ts (auth)
│       └── vite.config.ts
│
├── services/
│   └── ingestion/            # Python Lambda — PDF → vectors
│       ├── handler.py
│       ├── requirements.txt
│       └── serverless.yml
│
└── packages/
    └── shared-types/         # Shared TypeScript types (future)
```

---

## Local setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL (local or remote)
- AWS account (S3 + SNS + Lambda for full pipeline)
- Accounts: OpenAI · Pinecone · Stack Auth

---

### 1. Clone & install

```bash
git clone git@github.com:noelsasi/documind.git
cd documind
npm install          # installs root + workspaces
```

---

### 2. API (`apps/api`)

```bash
cd apps/api
cp .env.example .env   # fill in values below
npx prisma migrate dev
npm run dev            # starts on :8080 via serverless-offline
```

**`apps/api/.env`**

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/documind
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=documind
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:doc-ingestion-topic
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

### 3. Web (`apps/web`)

```bash
cd apps/web
cp .env.example .env
npm run dev            # starts on :5173
```

**`apps/web/.env`**

```env
VITE_API_URL=http://localhost:8080
VITE_STACK_PROJECT_ID=...
VITE_STACK_PUBLISHABLE_CLIENT_KEY=...
```

Get Stack Auth credentials at [stack-auth.com](https://stack-auth.com) — create a project, copy the project ID and publishable key.

---

### 4. Ingestion service (`services/ingestion`)

The ingestion Lambda is triggered by SNS in production. To test locally:

```bash
cd services/ingestion
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in Pinecone + DB + AWS creds
python test-local.py /path/to/your/file.pdf
```

**`services/ingestion/.env`**

```env
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=documind
DATABASE_URL=postgresql://user:pass@localhost:5432/documind
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

> **Note:** For local QnA testing, you only need the API + web running. The ingestion service only runs when a new PDF is uploaded. If you're testing against an already-ingested document, skip step 4.

---

### 5. Pinecone index setup

Create an index in your Pinecone project:
- **Dimensions:** `1536` (matches `text-embedding-3-small`)
- **Metric:** `cosine`
- **Name:** matches `PINECONE_INDEX_NAME` in your env

---

## Deployment

Both Lambda services deploy via Serverless Framework:

```bash
# API
cd apps/api
npx serverless deploy --stage prod

# Ingestion
cd services/ingestion
npx serverless deploy --stage prod
```

The web app is a static Vite build — deploy to Vercel, S3+CloudFront, or any static host:

```bash
cd apps/web
npm run build   # outputs to dist/
```

---

## Environment variables — full reference

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | API, Ingestion | PostgreSQL connection string |
| `OPENAI_API_KEY` | API | Used for embeddings + chat completions |
| `PINECONE_API_KEY` | API, Ingestion | Pinecone API key |
| `PINECONE_INDEX_NAME` | API, Ingestion | Name of the Pinecone index |
| `SNS_TOPIC_ARN` | API | ARN of the SNS topic that triggers ingestion |
| `AWS_S3_BUCKET` | API, Ingestion | S3 bucket for PDF storage |
| `AWS_REGION` | API, Ingestion | AWS region |
| `AWS_ACCESS_KEY_ID` | API, Ingestion | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | API, Ingestion | AWS credentials |
| `VITE_API_URL` | Web | Base URL of the API (dev: `http://localhost:8080`) |
| `VITE_STACK_PROJECT_ID` | Web | Stack Auth project ID |
| `VITE_STACK_PUBLISHABLE_CLIENT_KEY` | Web | Stack Auth publishable key |
