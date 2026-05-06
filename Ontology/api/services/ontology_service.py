"""Service layer for ontology generation: save PDFs, preprocess, run pipeline."""

from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path
from typing import List

from fastapi import UploadFile

from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.main import run_pipeline_async
from service.preprocessing.pdf_preprocessor_standalone import PDFPreprocessor

logger = logging.getLogger(__name__)


async def generate_ontology(files: List[UploadFile]) -> Path:
    """Save uploaded PDFs, preprocess to Markdown, run TBox pipeline, return ontology.ttl path."""
    config = get_config()
    preprocessed_dir = config.PREPROCESSED_DIR
    ttl_path = Path(config.OUTPUT_DIR) / config.OUTPUT_ONTOLOGY_TTL

    with tempfile.TemporaryDirectory() as tmp_pdf_dir:
        _save_uploads(files, Path(tmp_pdf_dir))
        await asyncio.to_thread(_preprocess_pdfs, Path(tmp_pdf_dir), preprocessed_dir)

    logger.info("Preprocessing complete. Running ontology pipeline…")
    await run_pipeline_async()

    if not ttl_path.exists():
        raise RuntimeError(f"Pipeline finished but output file was not produced: {ttl_path}")

    logger.info("Ontology generated at %s", ttl_path)
    return ttl_path


def _save_uploads(files: List[UploadFile], dest: Path) -> None:
    """Write each uploaded file to the destination directory."""
    for upload in files:
        dest_file = dest / (upload.filename or "upload.pdf")
        dest_file.write_bytes(upload.file.read())
        logger.info("Saved '%s' (%d bytes)", upload.filename, dest_file.stat().st_size)


def _preprocess_pdfs(pdf_dir: Path, md_dir: str) -> None:
    """Convert all PDFs in pdf_dir to Markdown files in md_dir."""
    Path(md_dir).mkdir(parents=True, exist_ok=True)
    processor = PDFPreprocessor(input_dir=str(pdf_dir), output_dir=md_dir)
    pdfs = sorted(pdf_dir.glob("*.pdf"))
    logger.info("Preprocessing %d PDF(s): %s → %s", len(pdfs), pdf_dir, md_dir)
    for pdf_path in pdfs:
        ok = processor.process_file(str(pdf_path))
        if not ok:
            logger.warning("Preprocessing returned failure for '%s'", pdf_path.name)
