"""End-to-end run of the ontology pipeline: PDFs -> Markdown -> OWL TBox.

Two stages, executed in order:

1. Preprocessing — converts every PDF in ``PDF_INPUT_DIR`` to a single
   ``.md`` file in ``PDF_OUTPUT_DIR`` using the existing standalone
   preprocessor (no LLM, no cost).
2. Ontology pipeline — runs the LangGraph 4-phase pipeline that produces
   ``classes.json``, ``classes.md``, ``ontology.ttl`` and ``ontology.owl``
   under ``OUTPUT_DIR``.

After both stages finish, a summary of the four output files and a preview
of the class hierarchy is printed.

Usage::

    python scripts/run_full_pipeline.py
    python scripts/run_full_pipeline.py --skip-preprocessing
    python scripts/run_full_pipeline.py --pdf-glob "Export*.pdf"
"""

from __future__ import annotations

import argparse
import asyncio
import concurrent.futures
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def parse_args() -> argparse.Namespace:
    """Parse CLI options."""
    parser = argparse.ArgumentParser(
        description="Run preprocessing + ontology pipeline end-to-end."
    )
    parser.add_argument(
        "--skip-preprocessing",
        action="store_true",
        help="Skip the PDF -> Markdown stage and reuse existing .md files.",
    )
    parser.add_argument(
        "--pdf-glob",
        default="*.pdf",
        help='Glob to filter PDFs in the input directory (default: "*.pdf").',
    )
    parser.add_argument(
        "--ttl-preview-chars",
        type=int,
        default=2000,
        help="How many characters of ontology.ttl to print at the end.",
    )
    return parser.parse_args()


def main() -> int:
    """Top-level orchestration: preprocess, run pipeline, show results."""
    args = parse_args()
    load_dotenv(PROJECT_ROOT / ".env")

    input_dir = _abs(os.getenv("PDF_INPUT_DIR", "data/data_bpi"))
    md_dir = _abs(os.getenv("PDF_OUTPUT_DIR", "data/output_markdowns"))
    ontology_dir = _abs(os.getenv("OUTPUT_DIR", "data/ontology_output"))

    if not args.skip_preprocessing:
        _run_preprocessing(input_dir, md_dir, args.pdf_glob)
    else:
        _print_header("STEP 1 — PREPROCESSING (skipped)")

    if not _has_markdown(md_dir):
        print(f"[ERROR] No .md files found in {md_dir}. "
              "Run without --skip-preprocessing first.", file=sys.stderr)
        return 1

    asyncio.run(_run_ontology_pipeline())
    _print_results(ontology_dir, args.ttl_preview_chars)
    return 0


def _run_preprocessing(input_dir: Path, md_dir: Path, pdf_glob: str) -> None:
    """Convert PDFs to Markdown via the existing standalone preprocessor."""
    _print_header("STEP 1 — PREPROCESSING (PDF -> Markdown)")
    pdfs = sorted(input_dir.glob(pdf_glob))
    if not pdfs:
        raise SystemExit(f"No PDFs match {pdf_glob!r} in {input_dir}")
    print(f"Input dir: {input_dir}")
    print(f"Output dir: {md_dir}")
    print(f"Processing {len(pdfs)} PDF(s) in parallel...\n")

    from service.preprocessing.pdf_preprocessor_standalone import PDFPreprocessor

    processor = PDFPreprocessor(input_dir=str(input_dir), output_dir=str(md_dir))
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(processor.process_file, [str(p) for p in pdfs]))
    elapsed = time.monotonic() - started
    success = sum(1 for ok in results if ok)
    print(f"\nPreprocessing finished: {success}/{len(pdfs)} succeeded in {elapsed:.1f}s.")


async def _run_ontology_pipeline() -> None:
    """Run the LangGraph ontology TBox pipeline (phases 1-4)."""
    _print_header("STEP 2 — ONTOLOGY PIPELINE (Phase 1 -> 2 -> 3 -> 4)")
    from service.ontology_tbox_pipeline.main import run_pipeline_async

    started = time.monotonic()
    await run_pipeline_async()
    elapsed = time.monotonic() - started
    print(f"\nOntology pipeline finished in {elapsed:.1f}s.")


def _print_results(ontology_dir: Path, ttl_preview_chars: int) -> None:
    """Print a summary of the four output files and a preview of the hierarchy."""
    _print_header("STEP 3 — RESULTS")
    if not ontology_dir.is_dir():
        print(f"[WARN] Output dir does not exist: {ontology_dir}")
        return

    print(f"Output directory: {ontology_dir}\n")
    print(f"{'FILE':<25} {'SIZE (KB)':>12}")
    print("-" * 40)
    for path in sorted(ontology_dir.iterdir()):
        if path.is_file():
            print(f"{path.name:<25} {path.stat().st_size / 1024:>12.1f}")

    _preview_classes_json(ontology_dir / "classes.json")
    _preview_classes_md(ontology_dir / "classes.md")
    _preview_turtle(ontology_dir / "ontology.ttl", ttl_preview_chars)


def _preview_classes_json(path: Path) -> None:
    """Show class counts + top-level names from ``classes.json``."""
    if not path.exists():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    top = data.get("classes", [])
    print(f"\n--- classes.json --- ({len(top)} top-level class(es))")
    for cls in top[:20]:
        children = len(cls.get("subclasses", []))
        suffix = f"  ({children} subclass{'es' if children != 1 else ''})" if children else ""
        print(f"  • {cls['name']}{suffix}")
    if len(top) > 20:
        print(f"  ... and {len(top) - 20} more")


def _preview_classes_md(path: Path) -> None:
    """Print the entire ``classes.md`` (it's already concise)."""
    if not path.exists():
        return
    print(f"\n--- classes.md ---")
    print(path.read_text(encoding="utf-8"))


def _preview_turtle(path: Path, max_chars: int) -> None:
    """Print the head of ``ontology.ttl`` as a quick sanity check."""
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    print(f"\n--- ontology.ttl --- (first {max_chars} of {len(text)} chars)")
    print(text[:max_chars])
    if len(text) > max_chars:
        print(f"\n... ({len(text) - max_chars} more characters)")


def _print_header(title: str) -> None:
    """Print a visually distinct section header."""
    bar = "=" * 80
    print(f"\n{bar}\n{title}\n{bar}")


def _abs(path_str: str) -> Path:
    """Resolve a path string to an absolute path under the project root."""
    path = Path(path_str)
    return path if path.is_absolute() else (PROJECT_ROOT / path).resolve()


def _has_markdown(directory: Path) -> bool:
    """True iff ``directory`` exists and contains at least one .md file."""
    return directory.is_dir() and any(directory.glob("*.md"))


if __name__ == "__main__":
    sys.exit(main())
