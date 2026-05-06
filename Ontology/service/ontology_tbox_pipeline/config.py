"""Pipeline configuration loaded from environment variables.

A single Pydantic settings object exposes every tunable. No other module
in the pipeline reads ``os.environ`` directly.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class PipelineConfig(BaseSettings):
    """Strongly typed configuration for the ontology TBox pipeline."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- API keys (one per parallel ReAct worker) --------------------------
    API_KEY_1: str = Field(..., description="API key for worker 1.")
    API_KEY_2: str = Field(..., description="API key for worker 2.")
    API_KEY_3: str = Field(..., description="API key for worker 3.")
    API_BASE_1: str = Field(..., description="API base URL for worker 1.")
    API_BASE_2: str = Field(..., description="API base URL for worker 2.")
    API_BASE_3: str = Field(..., description="API base URL for worker 3.")

    # --- Model -------------------------------------------------------------
    LITELLM_MODEL: str = Field("azure/gpt-5.4-nano")
    LITELLM_TEMPERATURE: float = Field(0.0)
    LITELLM_MAX_TOKENS: int = Field(4096)
    LITELLM_REQUEST_TIMEOUT: int = Field(120)

    # --- Chunking ----------------------------------------------------------
    CHUNK_SIZE: int = Field(60000, gt=0)
    CHUNK_OVERLAP: int = Field(1500, ge=0)

    # --- Paths -------------------------------------------------------------
    PREPROCESSED_DIR: str = Field("data/output_markdowns")
    OUTPUT_DIR: str = Field("data/ontology_output")

    # --- Output filenames --------------------------------------------------
    OUTPUT_CLASSES_JSON: str = Field("classes.json")
    OUTPUT_CLASSES_MD: str = Field("classes.md")
    OUTPUT_ONTOLOGY_TTL: str = Field("ontology.ttl")
    OUTPUT_ONTOLOGY_OWL: str = Field("ontology.owl")

    # --- Ontology metadata -------------------------------------------------
    ONTOLOGY_BASE_IRI: str = Field("https://talan.com/ontology/bpi#")
    ONTOLOGY_PREFIX: str = Field("bpi")

    # --- Concurrency & Retry -----------------------------------------------
    NUM_KEYS: int = Field(3, gt=0)
    RPM_PER_KEY: int = Field(5000, gt=0)
    TPM_PER_KEY: int = Field(5000000, gt=0)
    MAX_CONCURRENT_PER_KEY: int = Field(50, gt=0)
    
    LLM_RETRY_MAX_ATTEMPTS: int = Field(5, gt=0)
    LLM_RETRY_MAX_BACKOFF_S: int = Field(30, gt=0)

    # --- Deduplication -----------------------------------------------------
    ENABLE_LLM_ALIAS_MERGE: bool = Field(True)

    # --- Pipeline tuning ---------------------------------------------------
    PIPELINE_LOG_LEVEL: str = Field("INFO")

    @field_validator("CHUNK_OVERLAP")
    @classmethod
    def _overlap_smaller_than_size(cls, value: int, info) -> int:
        """Overlap must be strictly smaller than chunk size."""
        chunk_size = info.data.get("CHUNK_SIZE")
        if chunk_size is not None and value >= chunk_size:
            raise ValueError(
                f"CHUNK_OVERLAP ({value}) must be < CHUNK_SIZE ({chunk_size})."
            )
        return value

    @property
    def api_keys(self) -> List[str]:
        """Ordered list of API keys, one per parallel worker."""
        return [self.API_KEY_1, self.API_KEY_2, self.API_KEY_3]

    @property
    def api_bases(self) -> List[str]:
        """Ordered list of API base URLs, one per parallel worker."""
        return [self.API_BASE_1, self.API_BASE_2, self.API_BASE_3]

    @property
    def worker_count(self) -> int:
        """Number of parallel workers (always 3 — one per API key)."""
        return len(self.api_keys)


@lru_cache(maxsize=1)
def get_config() -> PipelineConfig:
    """Return the singleton pipeline configuration."""
    return PipelineConfig()
