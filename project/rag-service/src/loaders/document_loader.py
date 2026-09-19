from pathlib import Path
from typing import Any

import pandas as pd
from langchain_core.documents import Document
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter 


SUPPORTED_EXTENSIONS = {".pdf", ".csv", ".xls", ".xlsx", ".doc", ".docx"}


def load_document(
	file_path: str | Path,
	*,
	title: str | None = None,
	doc_type: str | None = None,
	year: int | None = None,
) -> list[Document]:
	"""Load a PDF, DOC, CSV, or Excel file into LangChain documents."""
	path = Path(file_path)
	extension = path.suffix.lower()

	if extension not in SUPPORTED_EXTENSIONS:
		supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
		raise ValueError(f"Unsupported file type: {extension}. Supported types: {supported}")
	if not path.is_file():
		raise FileNotFoundError(f"Document does not exist: {path}")

	metadata = _base_metadata(path, title=title, doc_type=doc_type, year=year)

	if extension == ".pdf":
		documents = PyMuPDFLoader(str(path)).load()
		for document in documents:
			document.metadata = {**metadata, **document.metadata}
		return documents

	if extension in {".doc", ".docx"}:
		return _load_word_document(path, metadata)

	if extension == ".csv":
		return _load_csv(path, metadata)

	return _load_excel(path, metadata)


def split_documents(
	documents: list[Document],
	*,
	chunk_size: int = 1000,
	chunk_overlap: int = 150,
) -> list[Document]:
	"""Split loaded documents into chunks while preserving their metadata."""
	if chunk_size <= 0:
		raise ValueError("chunk_size must be greater than zero")
	if chunk_overlap < 0 or chunk_overlap >= chunk_size:
		raise ValueError("chunk_overlap must be between zero and chunk_size - 1")

	splitter = RecursiveCharacterTextSplitter(
		chunk_size=chunk_size,
		chunk_overlap=chunk_overlap,
	)
	return splitter.split_documents(documents)


def _base_metadata(
	path: Path,
	*,
	title: str | None,
	doc_type: str | None,
	year: int | None,
) -> dict[str, Any]:
	metadata: dict[str, Any] = {
		"source": str(path.resolve()),
		"file_name": path.name,
		"file_type": path.suffix.lower().lstrip("."),
	}
	if title is not None:
		metadata["title"] = title
	if doc_type is not None:
		metadata["doc_type"] = doc_type
	if year is not None:
		metadata["year"] = year
	return metadata


def _load_word_document(path: Path, metadata: dict[str, Any]) -> list[Document]:
	import fitz

	doc = fitz.open(str(path))
	documents: list[Document] = []
	for page_index in range(doc.page_count):
		page = doc[page_index]
		text = page.get_text("text").strip()
		if not text:
			continue
		documents.append(Document(page_content=text, metadata={**metadata, "page": page_index + 1}))
	doc.close()
	return documents


def _load_csv(path: Path, metadata: dict[str, Any]) -> list[Document]:
	dataframe = pd.read_csv(path)
	return _dataframe_to_documents(dataframe, metadata, sheet_name=None)


def _load_excel(path: Path, metadata: dict[str, Any]) -> list[Document]:
	sheets = pd.read_excel(path, sheet_name=None)
	documents: list[Document] = []
	for sheet_name, dataframe in sheets.items():
		documents.extend(_dataframe_to_documents(dataframe, metadata, sheet_name=sheet_name))
	return documents


def _dataframe_to_documents(
	dataframe: pd.DataFrame,
	metadata: dict[str, Any],
	*,
	sheet_name: str | None,
) -> list[Document]:
	documents: list[Document] = []
	for row_number, row in enumerate(dataframe.to_dict(orient="records"), start=2):
		values = [f"{key}: {value}" for key, value in row.items() if pd.notna(value)]
		if not values:
			continue

		row_metadata = {**metadata, "row": row_number}
		if sheet_name is not None:
			row_metadata["sheet"] = sheet_name
		documents.append(Document(page_content="\n".join(values), metadata=row_metadata))
	return documents