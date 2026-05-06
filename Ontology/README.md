# Ontology Generation Backend

FastAPI backend that converts a set of PDF documents into a formal **OWL TBox ontology** using Azure OpenAI. It also exposes a workspace CRUD API backed by PostgreSQL.

---

## How the pipeline works

1. **Upload** — PDFs are sent to `POST /api/v1/ontology/generate`.
2. **Preprocessing** — Each PDF is converted to structured Markdown (text extraction + section segmentation).
3. **Chunking** — Markdown is split into ~60 000-character chunks using LangChain's `RecursiveCharacterTextSplitter`.
4. **Extraction (3 phases, parallel)** — A LangGraph `StateGraph` fans out each chunk across 3 Azure OpenAI workers simultaneously:
   - **Phase 1** — extract OWL classes and their hierarchy.
   - **Phase 2** — extract data properties (literal attributes) tied to the extracted classes.
   - **Phase 3** — extract object properties (relationships between classes).
5. **Deduplication** — Deterministic grouping collapses spelling variants; an optional LLM call merges true semantic synonyms.
6. **Assembly** — `rdflib` builds the in-memory RDF graph and serialises it to `ontology.ttl` (Turtle) and `ontology.owl` (OWL/XML).

The generated `ontology.ttl` is returned directly as a file download.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.11+ | Or use Docker (Python 3.11 in the image) |
| Azure OpenAI | 3 deployments recommended for parallel extraction — 1 also works |
| PostgreSQL | Optional — only needed for workspace CRUD endpoints |

---

## Local setup

```bash
# 1. Clone and create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in API_KEY_1/2/3, API_BASE_1/2/3, and DB_* if using workspaces

# 4. Start the server
uvicorn app:app --host localhost --port 7777 --reload
```

Swagger UI is available at [http://localhost:7777/api/docs](http://localhost:7777/api/docs).

---

## Docker setup

```bash
# 1. Build the image
docker build -t ontology-backend .

# 2. Run — mount an output volume and pass secrets via env file
docker run -d \
  --name ontology-backend \
  -p 7777:7777 \
  --env-file .env \
  -v $(pwd)/data/ontology_output:/app/data/ontology_output \
  ontology-backend
```

> **Windows (PowerShell):** replace `$(pwd)` with `${PWD}`.

The generated ontology files land in `./data/ontology_output/` on the host.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/ontology/generate` | Upload PDFs → returns `ontology.ttl` as a download |
| `GET` | `/api/v1/workspaces/` | List all workspaces *(requires PostgreSQL)* |
| `POST` | `/api/v1/workspaces/` | Create a workspace |
| `GET` | `/api/v1/workspaces/{id}` | Get workspace by ID |
| `PATCH` | `/api/v1/workspaces/{id}` | Partially update a workspace |
| `DELETE` | `/api/v1/workspaces/{id}` | Delete a workspace |
| `GET` | `/api/docs` | Swagger UI |

---

## Configuration

Copy `.env.example` to `.env` and fill in the required values.

| Variable | Required | Description |
|---|---|---|
| `API_KEY_1/2/3` | Yes | Azure OpenAI API keys (3 for full parallelism, 1 minimum) |
| `API_BASE_1/2/3` | Yes | Azure endpoint URLs — must include `?api-version=...` |
| `LITELLM_MODEL` | Yes | LiteLLM model string, e.g. `azure/gpt-4o-mini` |
| `FRONTEND_URL` | Yes | Frontend origin for CORS, e.g. `http://localhost:5173` |
| `DB_USER/PASSWORD/HOST/PORT/NAME` | No | PostgreSQL credentials (workspace endpoints only) |
| `CHUNK_SIZE` | No | Max chars per chunk (default `60000`) |
| `ENABLE_LLM_ALIAS_MERGE` | No | Run LLM synonym merge after dedup (default `true`) |
| `OUTPUT_DIR` | No | Where to write pipeline output (default `data/ontology_output`) |

See `.env.example` for all available options and their defaults.
