from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.middlewares.logging_middleware import LoggingMiddleware, RequestIDMiddleware
from api.routers.v1.workspace_router import router as workspaces_v1_router
from api.routers.v1.ontology_router import router as ontology_v1_router
from configuration.database import init_db
from configuration.logging_setup import logger
from configuration.settings import settings


def create_app() -> FastAPI:
    """Create FastAPI app with middleware, routers, and exception handling."""

    app = FastAPI(
        title=settings.TITLE,
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        docs_url=settings.DOCS_URL,
        redoc_url=settings.REDOC_URL,
        openapi_url=settings.OPENAPI_URL,
    )

    # Middleware
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(LoggingMiddleware)

    # CORS — always include the configured frontend URL explicitly
    cors_origins = [settings.FRONTEND_URL, *settings.CORS_ORIGINS]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(
        workspaces_v1_router,
        prefix=f"{settings.API_PREFIX}/v1",
    )
    app.include_router(
        ontology_v1_router,
        prefix=f"{settings.API_PREFIX}/v1",
    )

    # Exception handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=422,
            content={
                "detail": exc.errors(),
                "body": exc.body,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    return app


app = create_app()


# Startup DB tables — non-fatal so the ontology endpoint works without PostgreSQL
@app.on_event("startup")
async def on_startup():
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database ready.")
    except Exception as exc:
        logger.warning(
            "Database initialization failed (%s). "
            "Workspace endpoints will be unavailable; ontology endpoint is unaffected.",
            exc,
        )
