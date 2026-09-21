# Campus Policy & Placement Q&A

A no-auth campus knowledge desk that answers questions from uploaded policies,
placement documents, syllabi, circulars, and other institutional files. The
project has a React frontend, an Express API, and a FastAPI RAG service backed
by MongoDB Atlas Vector Search.

## Architecture

```text
Browser (React + Vite)       http://localhost:5173
            |
            v
Node API (Express)           http://localhost:5000
            |
            +--> MongoDB Atlas (documents, chat history)
            |
            v
Python RAG service (FastAPI) http://localhost:8000
            |
            +--> MongoDB Atlas Vector Search
            +--> Hugging Face sentence-transformers embeddings
            +--> Groq answer generation
```

## Repository structure

```text
client/       React 18 + Vite frontend
server/       Node.js + Express API and uploaded files
rag-service/  Python + FastAPI ingestion, retrieval, and generation service
```

The frontend provides two views:

- `/` - ask questions and optionally filter by document type or year
- `/admin` - upload source documents and view ingestion status

## Prerequisites

- Node.js and npm
- Python 3.13 or newer
- A MongoDB Atlas deployment with Vector Search enabled
- A Groq API key

## Configuration

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/campus_qa
CLIENT_ORIGIN=http://localhost:5173
RAG_SERVICE_URL=http://localhost:8000
UPLOAD_DIR=uploads
```

Create `rag-service/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/campus_qa
MONGODB_DATABASE=campus_qa
MONGODB_COLLECTION=document_chunks
MONGODB_VECTOR_INDEX=vector_index
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu
```

The defaults for the database, collection, vector index, embedding model, and
Groq model can be omitted when the default values are suitable. The Atlas
vector index must use the `embedding` field and cosine similarity. The selected
embedding model must match the index dimensions.

## Installation and startup

Install and start each service in a separate terminal from the repository root.

### 1. RAG service

Using a virtual environment:

```powershell
cd rag-service
python -m venv .venv
\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:PYTHONPATH = "src"
python -m uvicorn rag_service:app --host 0.0.0.0 --port 8000 --reload
```

Alternatively, with `uv`:

```bash
cd rag-service
uv sync
uv run rag-service
```

Verify `http://localhost:8000/health` returns `{ "status": "ok" }`.

### 2. Express API

```bash
cd server
npm install
npm run dev
```

Verify `http://localhost:5000/health` returns `{ "status": "ok" }` and the
server logs `[db] MongoDB connected`.

### 3. React client

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The client uses
`VITE_API_BASE_URL=http://localhost:5000` by default. To override it, create
`client/.env` with:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Useful commands

```bash
# Client production build
cd client && npm run build

# Start the API without file watching
cd server && npm start
```

## Data and limitations

- MongoDB stores document records in the `documents` collection and optional
  chat history in the `messages` collection.
- Vector chunks are stored in the configured MongoDB collection, which defaults
  to `document_chunks`.
- There is no authentication or authorization in the current application.
- Answers are generated only from retrieved uploaded content and should be
  verified against the cited source documents.
