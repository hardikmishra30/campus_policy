from typing import Any

from fastapi import FastAPI


app = FastAPI(title="Campus Q&A RAG Service")


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/ingest")
def ingest(payload: dict[str, Any]) -> dict[str, Any]:
	return {
		"status": "accepted",
		"documentId": payload.get("documentId"),
		"message": "Document ingestion is not implemented yet.",
	}



@app.post("/retrieve_and_generate")
def retrieve_and_generate(payload: dict[str, Any]) -> dict[str, Any]:
	return {
		"answer": "The RAG generation pipeline is not implemented yet.",
		"citations": [],
		"query": payload.get("query"),
	}


def main() -> None:
	import uvicorn

	uvicorn.run("rag_service:app", host="0.0.0.0", port=8000, reload=True)


__all__ = ["app", "health", "ingest", "retrieve_and_generate", "main"]
