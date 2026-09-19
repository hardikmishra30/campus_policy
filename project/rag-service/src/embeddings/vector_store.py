import os
from collections.abc import Sequence
from functools import lru_cache
from typing import Any

from langchain_core.documents import Document
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

from embeddings.embedding_model import get_embedding_model


DEFAULT_DATABASE_NAME = "campus_qa"
DEFAULT_COLLECTION_NAME = "document_chunks"
DEFAULT_INDEX_NAME = "vector_index"



@lru_cache(maxsize=1)
def get_vector_store() -> MongoDBAtlasVectorSearch:
	"""Create and cache the MongoDB Atlas Vector Search store."""
	mongodb_uri = os.getenv("MONGODB_URI")
	if not mongodb_uri:
		raise RuntimeError("MONGODB_URI is not set")

	client = MongoClient(mongodb_uri)
	database_name = os.getenv("MONGODB_DATABASE", DEFAULT_DATABASE_NAME)
	collection_name = os.getenv("MONGODB_COLLECTION", DEFAULT_COLLECTION_NAME)
	index_name = os.getenv("MONGODB_VECTOR_INDEX", DEFAULT_INDEX_NAME)

	return MongoDBAtlasVectorSearch(
		collection=client[database_name][collection_name],
		embedding=get_embedding_model(),
		index_name=index_name,
		text_key="text",
		embedding_key="embedding",
		relevance_score_fn="cosine",
	)


def add_documents(
	documents: Sequence[Document],
	*,
	ids: Sequence[str] | None = None,
) -> list[str]:
	"""Embed and store document chunks in MongoDB Atlas Vector Search."""
	documents_list = list(documents)
	if not documents_list:
		return []

	ids_list = list(ids) if ids is not None else None
	if ids_list is not None and len(ids_list) != len(documents_list):
		raise ValueError("ids must contain one ID for every document")

	return get_vector_store().add_documents(documents_list, ids=ids_list)


def similarity_search(
	query: str,
	*,
	k: int = 4,
	filters: dict[str, Any] | None = None,
) -> list[tuple[Document, float]]:
	"""Find relevant chunks and return each document with its similarity score."""
	if not isinstance(query, str) or not query.strip():
		raise ValueError("query must be a non-empty string")
	if k <= 0:
		raise ValueError("k must be greater than zero")

	return get_vector_store().similarity_search_with_score(
		query,
		k=k,
		pre_filter=build_pre_filter(filters),
	)


def build_pre_filter(filters: dict[str, Any] | None) -> dict[str, Any] | None:
	"""Convert API filters into MongoDB Atlas Vector Search filters."""
	if not filters:
		return None

	pre_filter: dict[str, Any] = {}
	doc_types = filters.get("docType", filters.get("doc_type"))
	years = filters.get("year")

	if doc_types:
		values = _as_list(doc_types)
		pre_filter["doc_type"] = {"$in": values}
	if years:
		values = [int(value) for value in _as_list(years)]
		pre_filter["year"] = {"$in": values}

	return pre_filter or None


def _as_list(value: Any) -> list[Any]:
	if isinstance(value, (list, tuple, set)):
		return list(value)
	return [value]


__all__ = [
	"DEFAULT_DATABASE_NAME",
	"DEFAULT_COLLECTION_NAME",
	"DEFAULT_INDEX_NAME",
	"get_vector_store",
	"add_documents",
	"similarity_search",
	"build_pre_filter",
]
