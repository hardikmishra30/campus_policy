from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI

from ingest.ingest_payload import ingest_from_payload
from services.qa_service import answer_query


load_dotenv()

app = FastAPI(title="Campus Q&A RAG Service")


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/ingest")
def ingest(payload: dict[str, Any]) -> dict[str, Any]:
	return ingest_from_payload(payload)



@app.post("/retrieve_and_generate")
def retrieve_and_generate(payload: dict[str, Any]) -> dict[str, Any]:
	query = payload.get("query")
	filters = payload.get("filters") or {}
	return answer_query(query, filters)


def main() -> None:
	import uvicorn

	uvicorn.run("rag_service:app", host="0.0.0.0", port=8000, reload=True)


__all__ = ["app", "health", "ingest", "retrieve_and_generate", "main"]
