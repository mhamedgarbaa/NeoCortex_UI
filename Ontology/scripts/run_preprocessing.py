"""Run the PDF preprocessor on every PDF in data/data_bpi.

Convenience wrapper around ``service.preprocessing.pdf_preprocessor_standalone``:
- loads ``.env`` so PDF_INPUT_DIR / PDF_OUTPUT_DIR / CHUNK_* are honored,
- runs the preprocessor,
- prints a summary table of output files (chunk count + size).

Usage::

    python scripts/run_preprocessing.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def main() -> int:
    """Load env, run the preprocessor, then print a summary."""
    load_dotenv(PROJECT_ROOT / ".env")

    input_dir = Path(os.getenv("PDF_INPUT_DIR", "data/data_bpi"))
    output_dir = Path(os.getenv("PDF_OUTPUT_DIR", "data/output_markdowns"))
    if not input_dir.is_absolute():
        input_dir = PROJECT_ROOT / input_dir
    if not output_dir.is_absolute():
        output_dir = PROJECT_ROOT / output_dir

    pdfs = sorted(input_dir.glob("*.pdf"))
    if not pdfs:
        print(f"[ERROR] No PDFs found in {input_dir}", file=sys.stderr)
        return 1
    print(f"Found {len(pdfs)} PDF(s) in {input_dir}")
    print(f"Output dir: {output_dir}")
    print()

    # Imported here so the env vars are seen at module load time.
    from service.preprocessing.pdf_preprocessor_standalone import PDFPreprocessor

    processor = PDFPreprocessor(
        input_dir=str(input_dir),
        output_dir=str(output_dir),
    )
    started = time.monotonic()
    processor.run()
    elapsed = time.monotonic() - started

    print()
    _print_summary(output_dir, elapsed)
    return 0


def _print_summary(output_dir: Path, elapsed_seconds: float) -> None:
    """Print a one-line-per-file summary of the produced .md files."""
    md_files = sorted(output_dir.glob("*.md"))
    separator = "\n\n---CHUNK_SEPARATOR---\n\n"

    print(f"Wrote {len(md_files)} markdown file(s) in {elapsed_seconds:.1f}s.")
    print()
    print(f"{'FILE':<70} {'CHUNKS':>7} {'SIZE (KB)':>10}")
    print("-" * 90)
    total_chunks = 0
    total_size = 0
    for path in md_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        chunk_count = text.count(separator) + 1 if text else 0
        size_kb = path.stat().st_size / 1024
        total_chunks += chunk_count
        total_size += size_kb
        print(f"{path.name:<70} {chunk_count:>7} {size_kb:>10.1f}")
    print("-" * 90)
    print(f"{'TOTAL':<70} {total_chunks:>7} {total_size:>10.1f}")


if __name__ == "__main__":
    raise SystemExit(main())
