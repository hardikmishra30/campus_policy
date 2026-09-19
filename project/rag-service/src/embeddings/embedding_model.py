import os
from functools import lru_cache
from collections.abc import Sequence

from langchain_huggingface import HuggingFaceEmbeddings


DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_EMBEDDING_DEVICE = "cpu"

@lru_cache(maxsize=4)
def get_embedding_model(

	model_name: str | None = None,
) -> HuggingFaceEmbeddings:
	"""Create and cache the configured sentence-transformer embedding model."""
	selected_model = model_name or os.getenv(
		"EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL
	)

	return HuggingFaceEmbeddings(
		model_name=selected_model,
		model_kwargs={"device": os.getenv("EMBEDDING_DEVICE", "cpu")},
		encode_kwargs={"normalize_embeddings": True},
	)


def embed_documents(
	texts: Sequence[str],
	*,
	model_name: str | None = None,
) -> list[list[float]]:
	"""Convert document chunks into normalized embedding vectors."""
	if not texts:
		return []
	if any(not isinstance(text, str) or not text.strip() for text in texts):
		raise ValueError("texts must contain only non-empty strings")

	model = get_embedding_model(model_name)
	return model.embed_documents(list(texts))


def embed_query(query: str, *, model_name: str | None = None) -> list[float]:
	"""Convert one user query into a normalized embedding vector."""
	if not isinstance(query, str) or not query.strip():
		raise ValueError("query must be a non-empty string")

	return get_embedding_model(model_name).embed_query(query)


__all__ = [
	"DEFAULT_EMBEDDING_MODEL",
	"get_embedding_model",
	"embed_documents",
	"embed_query",
]
