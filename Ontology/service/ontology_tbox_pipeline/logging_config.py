"""Logger factory for the ontology TBox pipeline.

Module import has no side effects; callers must invoke ``configure_logging``
explicitly (typically once, from ``main.py``) to set up handlers.
"""

from __future__ import annotations

import logging
import sys

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"
_CONFIGURED = False


def configure_logging(level: str = "INFO") -> None:
    """Install a single stdout handler at the given level on the root logger."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, _DATE_FORMAT))
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a logger namespaced under the pipeline package."""
    return logging.getLogger(f"ontology_tbox_pipeline.{name}")
