"""Reads preprocessed Markdown files and splits them into ontology-pipeline chunks.

The preprocessor inserts a ``---CHUNK_SEPARATOR---`` token between its own
sub-chunks inside each ``.md`` file. We strip those markers and re-chunk on
the raw text using the configured ``CHUNK_SIZE`` / ``CHUNK_OVERLAP``.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from service.ontology_tbox_pipeline.logging_config import get_logger

_LOGGER = get_logger("chunking")
_PREPROCESSOR_SEPARATOR = "\n\n---CHUNK_SEPARATOR---\n\n"
_SPLITTER_SEPARATORS = ["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " ", ""]


@dataclass(frozen=True)
class Chunk:
    """An ontology-pipeline chunk derived from a preprocessed Markdown file."""

    chunk_id: str
    source_document: str
    chunk_index: int
    text: str


def load_and_chunk_markdown_files(
    preprocessed_dir: str,
    chunk_size: int,
    chunk_overlap: int,
) -> List[Chunk]:
    """Load every ``.md`` file in ``preprocessed_dir`` and return chunked text."""
    paths = _list_markdown_files(preprocessed_dir)
    splitter = _build_splitter(chunk_size, chunk_overlap)
    chunks: List[Chunk] = []
    for path in paths:
        chunks.extend(_chunk_single_file(path, splitter, len(chunks)))
    _LOGGER.info(
        "Chunked %d markdown file(s) into %d chunk(s).", len(paths), len(chunks)
    )
    return chunks


def _list_markdown_files(directory: str) -> List[Path]:
    """Return sorted ``.md`` files under ``directory``; raise if none found."""
    base = Path(directory)
    if not base.is_dir():
        raise FileNotFoundError(f"Preprocessed directory not found: {base}")
    files = sorted(base.glob("*.md"))
    if not files:
        raise RuntimeError(
            f"No .md files found in {base} — PDF preprocessing likely failed for all inputs."
        )
    return files


def _build_splitter(chunk_size: int, chunk_overlap: int) -> RecursiveCharacterTextSplitter:
    """Construct the recursive splitter with structural separators."""
    return RecursiveCharacterTextSplitter(
        separators=_SPLITTER_SEPARATORS,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )


def _chunk_single_file(
    path: Path, splitter: RecursiveCharacterTextSplitter, start_index: int
) -> List[Chunk]:
    """Read one file, strip preprocessor markers, return its chunks."""
    raw = _read_text(path)
    cleaned = raw.replace(_PREPROCESSOR_SEPARATOR, "\n\n")
    pieces = [p.strip() for p in splitter.split_text(cleaned) if p.strip()]
    return [
        Chunk(
            chunk_id=f"{path.stem}__chunk_{idx:04d}",
            source_document=path.name,
            chunk_index=start_index + idx,
            text=text,
        )
        for idx, text in enumerate(pieces)
    ]


def _read_text(path: Path) -> str:
    """Read a file as UTF-8 with replacement on decoding errors."""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        _LOGGER.warning("UTF-8 decode failed for %s; falling back with replacement.", path)
        return path.read_text(encoding="utf-8", errors="replace")
