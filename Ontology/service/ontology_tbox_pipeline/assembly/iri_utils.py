"""IRI fragment helpers — turn extracted names into safe IRI suffixes."""

from __future__ import annotations

import re
import unicodedata


def slugify_pascal_case(name: str) -> str:
    """Return a PascalCase ASCII identifier safe for use in an IRI fragment."""
    if not name:
        return "Unnamed"
    ascii_name = _strip_diacritics(name)
    parts = re.split(r"[^A-Za-z0-9]+", ascii_name)
    cleaned = "".join(_capitalize_first(part) for part in parts if part)
    if not cleaned:
        return "Unnamed"
    if cleaned[0].isdigit():
        cleaned = f"N{cleaned}"
    return cleaned


def slugify_camel_case(name: str) -> str:
    """Return a camelCase ASCII identifier safe for use in an IRI fragment."""
    pascal = slugify_pascal_case(name)
    return pascal[0].lower() + pascal[1:] if pascal else "unnamed"


def _strip_diacritics(text: str) -> str:
    """Remove combining marks so 'É' becomes 'E'."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def _capitalize_first(token: str) -> str:
    """Uppercase only the first character; preserve the rest."""
    return token[:1].upper() + token[1:] if token else token
