from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from services.ingest_service import ingest_document


class IngestPayload(BaseModel):
	"""Request contract sent by the Node server to the RAG service."""

	model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

	document_id: str = Field(alias="documentId", min_length=1)
	file_path: Path = Field(alias="filePath")
	title: str = Field(min_length=1)
	doc_type: str = Field(alias="docType", min_length=1)
	year: int = Field(ge=1900, le=2200)

	@field_validator("file_path")
	@classmethod
	def validate_file_path(cls, value: Path) -> Path:
		if not value.is_file():
			raise ValueError(f"Document does not exist: {value}")
		return value


def ingest_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
	"""Validate a Node request payload and run the ingestion workflow."""
	request = IngestPayload.model_validate(payload)
	return ingest_document(
		file_path=request.file_path,
		document_id=request.document_id,
		title=request.title,
		doc_type=request.doc_type,
		year=request.year,
	)


__all__ = ["IngestPayload", "ingest_from_payload"]
