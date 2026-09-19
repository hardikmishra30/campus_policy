from typing import Any

from generation.answer_generator import generate_answer
from retrieval.retriever import retrieve_documents


def answer_query(
	query: str,
	filters: dict[str, Any] | None = None,
	*,
	k: int = 4,
) -> dict[str, object]:
	"""Retrieve context and generate an answer for the Node chat endpoint."""
	if not isinstance(query, str) or not query.strip():
		raise ValueError("query is required")

	documents = retrieve_documents(query, k=k, filters=filters)
	return generate_answer(query, documents)


__all__ = ["answer_query"]
