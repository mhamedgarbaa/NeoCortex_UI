"""Router for the ontology generation endpoint."""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from api.services.ontology_service import generate_ontology

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ontology", tags=["ONTOLOGY"])

_PDF_CONTENT_TYPE = "application/pdf"


@router.post(
    "/generate",
    summary="Generate ontology.ttl from uploaded PDF files",
    status_code=status.HTTP_200_OK,
    response_class=FileResponse,
    responses={
        400: {"description": "No files provided or non-PDF files detected"},
        500: {"description": "Pipeline execution failed"},
    },
)
async def generate_ontology_endpoint(files: List[UploadFile]) -> FileResponse:
    """Accept one or more PDF files, run the TBox pipeline, return ontology.ttl."""
    _validate_pdf_files(files)
    try:
        ttl_path = await generate_ontology(files)
    except Exception as exc:
        logger.exception("Ontology generation failed.")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return FileResponse(
        path=str(ttl_path),
        media_type="text/turtle",
        filename="ontology.ttl",
    )


def _validate_pdf_files(files: List[UploadFile]) -> None:
    """Raise HTTP 400 if no files or if any file is not a PDF."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    invalid = [f.filename for f in files if f.content_type != _PDF_CONTENT_TYPE]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Non-PDF files detected: {', '.join(str(n) for n in invalid)}. Only PDF files are accepted.",
        )
