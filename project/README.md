# Campus Policy & Placement Q&A

No-auth RAG app. This zip contains **only** `client/` (React + Vite) and `server/`
(Node + Express). `rag-service/` (Python + FastAPI) is NOT included — build it
separately so it exposes:

- `POST http://localhost:8000/ingest`
- `POST http://localhost:8000/retrieve_and_generate`

## Folder structure

```
client/   React (Vite) frontend  -> http://localhost:5173
server/   Node + Express API     -> http://localhost:5000
```

## Setup

### 1. Server
```bash
cd server
npm install
```
Edit `server/.env`:
```
PORT=5000
MONGODB_URI=your_atlas_connection_string_here   # <-- set this
CLIENT_ORIGIN=http://localhost:5173
RAG_SERVICE_URL=http://localhost:8000
UPLOAD_DIR=uploads
```
Run:
```bash
npm run dev
```
Check `http://localhost:5000/health` -> `{ "status": "ok" }`.
Console should print `[db] MongoDB connected`.

### 2. Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`. `client/.env` already points to
`VITE_API_BASE_URL=http://localhost:5000`.

### 3. RAG service (you build this)
Must be reachable at `http://localhost:8000` with the two routes below.
Start it before testing `/upload` or the chat page end-to-end.

## API contracts

### Node endpoints (called by React)

**`GET /documents`**
Response: `Document[]`
```json
[
  {
    "_id": "…", "title": "Leave Policy 2024", "docType": "policy", "year": 2024,
    "status": "ingested", "createdAt": "…", "updatedAt": "…"
  }
]
```

**`POST /upload`** (multipart/form-data)
Fields: `file` (PDF), `title`, `docType`, `year`
Response:
```json
{ "document": { "...": "..." }, "ragResponse": { "...": "whatever /ingest returns" } }
```
On RAG failure, document is still saved; response includes `"warning"` and `"ragError"`.

**`POST /chat`**
Request:
```json
{ "query": "What is the leave policy?", "filters": { "docType": ["policy"], "year": [2024] } }
```
Response:
```json
{
  "answer": "…",
  "citations": [{ "docTitle": "Leave Policy 2024", "section": "3.2", "page": 5 }]
}
```

### Node → Python calls (server owns these; you implement the receiving side)

**`POST http://localhost:8000/ingest`**
Sent by `server/src/routes/upload.js`:
```json
{ "documentId": "mongo_id", "filePath": "/abs/path/on/disk.pdf", "title": "...", "docType": "...", "year": 2024 }
```

**`POST http://localhost:8000/retrieve_and_generate`**
Sent by `server/src/routes/chat.js`:
```json
{ "query": "...", "filters": { "docType": ["policy"], "year": [2024] } }
```
Must respond with `{ "answer": string, "citations": [{ "docTitle", "section", "page" }] }`
— server passes this straight through to the frontend.

## Notes
- `documents` collection: Mongoose model in `server/src/models/Document.js`.
- `messages` collection (chat history, optional/unused by UI): `server/src/models/Message.js`.
- Uploaded PDFs land in `server/uploads/` (gitignored except `.gitkeep`).
- CORS is locked to `CLIENT_ORIGIN` (defaults to `http://localhost:5173`).
