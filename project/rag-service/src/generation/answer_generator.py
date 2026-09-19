import os
from collections.abc import Sequence

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq


DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b"


def generate_answer(
	query: str,
	documents: Sequence[tuple[Document, float]],
) -> dict[str, object]:
	"""Generate an answer from retrieved chunks and return source citations."""
	if not isinstance(query, str) or not query.strip():
		raise ValueError("query must be a non-empty string")

	context = _format_context(documents)
	if not context:
		return {
			"answer": "I could not find relevant information in the uploaded documents.",
			"citations": [],
		}

	api_key = os.getenv("GROQ_API_KEY")
	if not api_key:
		raise RuntimeError("GROQ_API_KEY is not set")

	prompt = ChatPromptTemplate.from_messages(
		[
			(
				"system",
				"Answer only from the provided context. If the context does not "
				"contain the answer, say that you do not know. Keep the answer "
				"concise and do not invent facts.\n\nContext:\n{context}",
			),
			("human", "Question: {query}"),
		]
	)
	model = ChatGroq(
		model=os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
		temperature=0,
		api_key=api_key,
	)
	response = (prompt | model).invoke({"context": context, "query": query.strip()})

	return {
		"answer": str(response.content),
		"citations": build_citations(documents),
	}


def build_citations(
	documents: Sequence[tuple[Document, float]],
) -> list[dict[str, object]]:
	"""Convert retrieved chunk metadata into the Node API citation format."""
	citations: list[dict[str, object]] = []
	seen: set[tuple[object, object, object]] = set()
	for document, _score in documents:
		metadata = document.metadata
		citation = {
			"docTitle": metadata.get("title") or metadata.get("file_name", "Unknown document"),
			"section": metadata.get("section"),
			"page": metadata.get("page"),
		}
		key = (citation["docTitle"], citation["section"], citation["page"])
		if key not in seen:
			seen.add(key)
			citations.append(citation)
	return citations


def _format_context(documents: Sequence[tuple[Document, float]]) -> str:
	parts: list[str] = []
	for index, (document, score) in enumerate(documents, start=1):
		metadata = document.metadata
		source = metadata.get("title") or metadata.get("file_name", "Unknown document")
		page = metadata.get("page")
		location = f", page {page}" if page is not None else ""
		parts.append(f"[{index}] Source: {source}{location}\n{document.page_content}")
	return "\n\n".join(parts)


__all__ = ["DEFAULT_GROQ_MODEL", "generate_answer", "build_citations"]
