from typing import Any

from langchain_core.documents import Document

from embeddings.vector_store import similarity_search


def retrieve_documents(
	query: str,
	*,
	k: int = 4,
	filters: dict[str, Any] | None = None,
) -> list[tuple[Document, float]]:
	"""Retrieve the most relevant document chunks for a user query."""
	if not isinstance(query, str) or not query.strip():
		raise ValueError("query must be a non-empty string")
	if k <= 0:
		raise ValueError("k must be greater than zero")

	return similarity_search(query.strip(), k=k, filters=filters)


__all__ = ["retrieve_documents"]
