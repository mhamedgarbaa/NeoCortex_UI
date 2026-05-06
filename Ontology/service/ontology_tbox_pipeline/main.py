"""Standalone entry point for the ontology TBox pipeline.

Usage::

    python -m service.ontology_tbox_pipeline.main
"""

from __future__ import annotations

import asyncio

from service.ontology_tbox_pipeline.chunking import load_and_chunk_markdown_files
from service.ontology_tbox_pipeline.config import get_config
from service.ontology_tbox_pipeline.logging_config import configure_logging, get_logger
from service.ontology_tbox_pipeline.orchestration import (
    build_initial_state,
    build_pipeline,
)


async def run_pipeline_async() -> None:
    """Load chunks, build the LangGraph pipeline, and execute it end-to-end."""
    config = get_config()
    configure_logging(config.PIPELINE_LOG_LEVEL)
    logger = get_logger("main")

    logger.info("Starting ontology TBox pipeline.")
    chunks = load_and_chunk_markdown_files(
        preprocessed_dir=config.PREPROCESSED_DIR,
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
    )
    if not chunks:
        logger.error("No chunks produced from %s; aborting.", config.PREPROCESSED_DIR)
        return

    pipeline = build_pipeline()
    initial_state = build_initial_state(chunks)
    await pipeline.ainvoke(initial_state, config=_run_config(len(chunks)))
    logger.info("Pipeline finished. Outputs in %s.", config.OUTPUT_DIR)


def _run_config(chunk_count: int) -> dict:
    """LangGraph runtime config — recursion limit must accommodate fan-out."""
    return {"recursion_limit": max(50, chunk_count * 6)}


def main() -> None:
    """Synchronous CLI wrapper around ``run_pipeline_async``."""
    asyncio.run(run_pipeline_async())


if __name__ == "__main__":
    main()
