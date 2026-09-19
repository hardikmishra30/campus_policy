from pathlib import Path
from typing import Any

from langchain_core.documents import Document

from embeddings.vector_store import add_documents
from loaders.document_loader import load_document, split_documents


def ingest_payload(payload: dict[str, Any]) -> dict[str, Any]:
	"""Ingest one document using the payload sent by the Node server."""
	if not isinstance(payload, dict):
		raise ValueError("ingest payload must be an object")

	file_path = payload.get("filePath")
	if not file_path:
		raise ValueError("filePath is required")

	return ingest_document(
		file_path=file_path,
		document_id=payload.get("documentId"),
		title=payload.get("title"),
		doc_type=payload.get("docType"),
		year=payload.get("year"),
	)


def ingest_document(
	file_path: str | Path,
	*,
	document_id: str | None = None,
	title: str | None = None,
	doc_type: str | None = None,
	year: int | str | None = None,
	chunk_size: int = 1000,
	chunk_overlap: int = 150,
) -> dict[str, Any]:
	"""Load, split, embed, and store one source document."""
	year_value = int(year) if year is not None else None
	documents = load_document(
		file_path,
		title=title,
		doc_type=doc_type,
		year=year_value,
	)
	_documents_with_id(documents, document_id)
	chunks = split_documents(
		documents,
		chunk_size=chunk_size,
		chunk_overlap=chunk_overlap,
	)
	stored_ids = add_documents(chunks)

	return {
		"status": "ingested",
		"documentId": document_id,
		"filePath": str(file_path),
		"sourceDocuments": len(documents),
		"chunks": len(chunks),
		"storedIds": stored_ids,
	}


def _documents_with_id(
	documents: list[Document],
	document_id: str | None,
) -> None:
	if document_id is None:
		return

	for document in documents:
		document.metadata["document_id"] = document_id


__all__ = ["ingest_payload", "ingest_document"]
