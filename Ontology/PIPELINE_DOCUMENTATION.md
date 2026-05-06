# Ontology TBox Pipeline — Technical Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Entry Point & Configuration](#5-entry-point--configuration)
6. [Step 0 — Preprocessing](#6-step-0--preprocessing)
7. [Step 1 — Chunking](#7-step-1--chunking)
8. [Step 2 — Phase 1: Class Extraction](#8-step-2--phase-1-class-extraction)
9. [Step 3 — Phase 2: Data Property Extraction](#9-step-3--phase-2-data-property-extraction)
10. [Step 4 — Phase 3: Object Property Extraction](#10-step-4--phase-3-object-property-extraction)
11. [Step 5 — Phase 4: Deterministic Assembly](#11-step-5--phase-4-deterministic-assembly)
12. [Deduplication System](#12-deduplication-system)
13. [LLM Client — Rate Limiting & Concurrency](#13-llm-client--rate-limiting--concurrency)
14. [Output Files](#14-output-files)
15. [Performance Characteristics](#15-performance-characteristics)
16. [Configuration Reference](#16-configuration-reference)

---

## 1. Overview

The **Ontology TBox Pipeline** is a multi-stage, multi-agent system that converts a collection of preprocessed PDF documents (expressed as Markdown) into a formal **OWL TBox ontology**. It extracts ontological concepts and relationships entirely from the document content using an LLM, then assembles a machine-readable knowledge graph.

**What it produces (for each run):**

| File | Content |
|---|---|
| `classes.json` | Full class hierarchy as a nested JSON tree |
| `classes.md` | Human-readable Markdown list with subclass indentation |
| `ontology.ttl` | OWL/RDF Turtle serialization (~4,000+ triples) |
| `ontology.owl` | OWL/XML serialization of the same graph |

**What it extracts:**

- **Classes** — domain concepts (e.g., `FinancialInstrument`, `LoanContract`, `Borrower`)
- **Data Properties** — literal attributes of classes (e.g., `loanAmount: xsd:decimal`)
- **Object Properties** — relationships between classes (e.g., `hasCustomer`, `managedBy`)

It does **not** extract individuals (named instances). The output is a pure TBox — a schema-level ontology.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      INPUT                              │
│         18 preprocessed Markdown files                  │
│              (data/output_markdowns/)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    CHUNKING                             │
│   RecursiveCharacterTextSplitter (60,000 chars)        │
│   → 32 Chunk objects                                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              LANGGRAPH StateGraph                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PHASE 1 — Class Extraction                       │  │
│  │  ┌──────────┐   Send()×32   ┌─────────────────┐ │  │
│  │  │ dispatch │──────────────▶│ worker×32       │ │  │
│  │  │  node    │               │ (parallel, 3 LLM│ │  │
│  │  └──────────┘               │  keys)          │ │  │
│  │                             └────────┬────────┘ │  │
│  │                                      │fan-in    │  │
│  │                             ┌────────▼────────┐ │  │
│  │                             │  dedup node     │ │  │
│  │                             │ (deterministic  │ │  │
│  │                             │  + optional LLM)│ │  │
│  │                             └────────┬────────┘ │  │
│  └──────────────────────────────────────┼──────────┘  │
│                                         │               │
│  ┌──────────────────────────────────────┼──────────┐  │
│  │ PHASE 2 — Data Property Extraction   │          │  │
│  │  (same fan-out/fan-in pattern,        │          │  │
│  │   receives deduplicated_classes)      │          │  │
│  └──────────────────────────────────────┼──────────┘  │
│                                         │               │
│  ┌──────────────────────────────────────┼──────────┐  │
│  │ PHASE 3 — Object Property Extraction │          │  │
│  │  (same fan-out/fan-in pattern)        │          │  │
│  └──────────────────────────────────────┼──────────┘  │
│                                         │               │
│  ┌──────────────────────────────────────▼──────────┐  │
│  │ PHASE 4 — Deterministic Assembly (no LLM)       │  │
│  │  rdflib graph build → 4 output files            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Orchestration** | [LangGraph](https://github.com/langchain-ai/langgraph) 0.6.x | `StateGraph` with `Send()` fan-out for parallel worker dispatch |
| **LLM Access** | [LiteLLM](https://github.com/BerriAI/litellm) + `langchain-litellm` | Unified API wrapper over Azure OpenAI endpoints |
| **LLM Model** | Azure OpenAI `gpt-5.4-nano` | Class/property extraction via structured output |
| **Structured Output** | LangChain `with_structured_output()` + Pydantic | Forces LLM to return typed JSON — no post-parsing required |
| **Retry Logic** | [Tenacity](https://github.com/jd/tenacity) | Exponential backoff strictly on HTTP 429 (rate limit) |
| **Text Splitting** | `langchain_text_splitters.RecursiveCharacterTextSplitter` | Markdown-aware chunking with structural separators |
| **Configuration** | [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | Typed config from `.env` with validation |
| **RDF Serialization** | [rdflib](https://rdflib.readthedocs.io/) | OWL/RDF graph construction + Turtle/OWL-XML output |
| **Concurrency** | `asyncio.Semaphore` per API key | Prevents swarming any single Azure endpoint |
| **Shared State** | Custom `AsyncAppendOnlyStore[T]` | `asyncio.Lock`-protected append-only list for parallel workers |

---

## 4. Project Structure

```
service/ontology_tbox_pipeline/
│
├── config.py                        # Pydantic Settings — single source of truth
├── main.py                          # Async entry point, wires chunks → pipeline
├── logging_config.py                # Structured log setup
│
├── chunking/
│   └── markdown_chunker.py          # Loads .md files, strips separators, splits to Chunks
│
├── state/
│   ├── records.py                   # Dataclasses: ClassRecord, CanonicalClass, etc.
│   ├── shared_stores.py             # AsyncAppendOnlyStore[T]
│   └── pipeline_state.py            # LangGraph TypedDict state schema
│
├── schemas/
│   └── extraction_schemas.py        # Pydantic models bound to LLM structured output
│
├── prompts/
│   └── extraction_prompts.py        # System + user prompt templates for each phase
│
├── llm/
│   ├── llm_factory.py               # ChatLiteLLM construction + SemaphoreWrappedLLM
│   ├── retry.py                     # Tenacity 429-only retry decorator
│   └── concurrency.py               # Per-key asyncio.Semaphore registry
│
├── agents/
│   ├── class_extractor_agent.py     # build_class_extractor_chain()
│   ├── data_property_extractor_agent.py
│   └── object_property_extractor_agent.py
│
├── dedup/
│   ├── deterministic.py             # Pure Python grouping → CanonicalXxx records
│   └── llm_alias_merger.py          # Optional single-call LLM synonym merge
│
├── phases/
│   ├── phase1_classes.py            # Dispatcher + worker + dedup nodes for classes
│   ├── phase2_data_properties.py    # Same pattern for data properties
│   ├── phase3_object_properties.py  # Same pattern for object properties
│   └── phase4_assembly.py           # Deterministic RDF assembly (no LLM)
│
├── orchestration/
│   └── pipeline_graph.py            # StateGraph wiring + build_initial_state()
│
└── assembly/
    ├── iri_utils.py                  # PascalCase / camelCase → IRI fragment slugs
    ├── ontology_builder.py          # rdflib graph construction
    ├── classes_json_writer.py        # Nested JSON forest serializer
    ├── classes_markdown_writer.py    # Markdown hierarchy writer
    ├── turtle_writer.py             # .ttl serializer
    └── owl_writer.py                # .owl (OWL/XML) serializer
```

---

## 5. Entry Point & Configuration

### Entry Point — `main.py`

`run_pipeline_async()` is the top-level coroutine. It:

1. Loads configuration from `.env` via `get_config()` (a `lru_cache`-wrapped singleton).
2. Calls `load_and_chunk_markdown_files()` to produce a flat list of `Chunk` objects.
3. Calls `build_pipeline()` to compile the `StateGraph`.
4. Calls `build_initial_state(chunks)` to create the starting LangGraph state (empty stores + chunk list).
5. Calls `await pipeline.ainvoke(initial_state)` to execute the entire graph asynchronously.

The LangGraph `recursion_limit` is set to `max(50, chunk_count × 6)` to accommodate the fan-out depth from all parallel `Send()` dispatches.

### Configuration — `config.py`

All settings are declared as a `PipelineConfig(BaseSettings)` class, which reads from the `.env` file. This means **no module reads `os.environ` directly** — all values come through the typed config object.

Key settings:

```
CHUNK_SIZE=60000          # Max characters per text chunk
CHUNK_OVERLAP=1500        # Overlap between adjacent chunks (for context continuity)
MAX_CONCURRENT_PER_KEY=50 # Max simultaneous LLM calls per API key
LLM_RETRY_MAX_ATTEMPTS=5  # Max retries on 429
LLM_RETRY_MAX_BACKOFF_S=30 # Max seconds between retries
ENABLE_LLM_ALIAS_MERGE=true # Run optional LLM synonym merge after deterministic dedup
```

---

## 6. Step 0 — Preprocessing

**Location:** `scripts/run_preprocessing.py`  
**Input:** Raw PDF files in `data/data_bpi/`  
**Output:** Preprocessed Markdown files in `data/output_markdowns/`

Before the ontology pipeline runs, each PDF is converted to structured Markdown by a separate preprocessing step. This step:

- Extracts text from PDFs (with OCR fallback for scanned pages)
- Segments the text into logical sections
- Writes each document as a `.md` file, with section boundaries marked by `---CHUNK_SEPARATOR---` tokens

The main pipeline skips this step if `--skip-preprocessing` is passed to the run script (when Markdown files are already available).

---

## 7. Step 1 — Chunking

**Location:** `chunking/markdown_chunker.py`  
**Technology:** `langchain_text_splitters.RecursiveCharacterTextSplitter`

The chunker loads all `.md` files from `data/output_markdowns/`, strips the `---CHUNK_SEPARATOR---` markers (which were for the preprocessor's internal use), and re-chunks the raw text.

**Splitting strategy:** The splitter tries to break on structural Markdown boundaries first, in order of preference:

```
"\n## " → "\n### " → "\n#### " → "\n\n" → "\n" → " " → ""
```

This hierarchy ensures chunks break at section or paragraph boundaries before resorting to mid-sentence splits.

**Chunk object:**

```python
@dataclass(frozen=True)
class Chunk:
    chunk_id: str           # e.g. "Annual_Report_2024__chunk_0003"
    source_document: str    # original .md filename
    chunk_index: int        # global position across all files
    text: str               # the raw text content
```

**Size settings (optimized):**

| Setting | Value | Rationale |
|---|---|---|
| `CHUNK_SIZE` | 60,000 chars | ~3× larger than original (20k) → reduces chunk count from ~79 to ~32 |
| `CHUNK_OVERLAP` | 1,500 chars | Ensures concepts spanning two chunks are seen by both workers |

With 18 documents and these settings, the pipeline produces **~32 chunks** — each processed by one parallel LLM call.

---

## 8. Step 2 — Phase 1: Class Extraction

**Location:** `phases/phase1_classes.py`, `agents/class_extractor_agent.py`  
**Goal:** Extract all ontological classes (concepts) from every chunk in parallel.

### 8.1 Graph Wiring

```
START → dispatch_phase1 ──Send()×32──▶ class_extractor_worker (×32, parallel)
                                                │
                                                ▼ (fan-in, all workers done)
                                        class_dedup_node
                                                │
                                                ▼
                                        dispatch_phase2
```

### 8.2 Dispatcher Node — `dispatch_phase1()`

The dispatcher reads the `chunks` list from the graph state and returns a `List[Send]` — one `Send` per chunk. Each `Send` carries its own isolated payload:

```python
Send("class_extractor_worker", {
    "chunks": chunks,          # full chunk list (worker picks its own by index)
    "class_store": class_store, # shared store reference
    "chunk_index": idx,
    "worker_id": idx % 3,      # cycles across the 3 API keys
})
```

> **LangGraph isolation rule:** Each `Send()` creates a completely isolated state for the spawned node. The parent state is NOT inherited — every key the worker needs must be explicitly included in the payload.

### 8.3 Worker Node — `class_extractor_worker_node()`

Each worker:

1. Picks its chunk: `chunk = state["chunks"][state["chunk_index"]]`
2. Builds a structured-output LLM chain: `chain = build_class_extractor_chain(worker_id)`
3. Invokes the chain with both system and user prompts:

```python
result = await chain.ainvoke([
    SystemMessage(content=CLASS_EXTRACTION_SYSTEM_PROMPT),
    HumanMessage(content=CLASS_EXTRACTION_USER_PROMPT.format(chunk_text=chunk.text)),
])
```

4. Maps the Pydantic response to `ClassRecord` objects and appends them to the shared `class_store`.

**The extraction schema (`ExtractedClassList`):**

```python
class ExtractedClass(BaseModel):
    name: str           # PascalCase class name (e.g. "FinancialInstrument")
    parent_name: Optional[str]  # superclass, if any
    description: str    # concise definition

class ExtractedClassList(BaseModel):
    classes: List[ExtractedClass]
```

The LLM **must** return a JSON object matching this schema — no tool calls, no reasoning steps, just direct structured output. This replaces the old ReAct loop that made 5–8 LLM calls per chunk.

**System prompt excerpt:**

```
You are an expert ontology engineer.
Extract ONLY classes (e.g., FinancialInstrument, Organization, Bank).
Do NOT extract specific named instances/individuals (e.g., "Bpifrance" or "John Doe").
Class names MUST be PascalCase.
Return ALL classes found in the text. Be thorough.
```

### 8.4 Shared Store — `AsyncAppendOnlyStore[ClassRecord]`

All 32 worker coroutines share a single `AsyncAppendOnlyStore[ClassRecord]` instance, passed by reference in the LangGraph state. An `asyncio.Lock` serializes concurrent appends:

```python
async def append(self, item: T) -> None:
    async with self._lock:
        self._items.append(item)
```

Workers return `{}` (no state delta) — they mutate the store in-place.

### 8.5 Dedup Node — `class_dedup_node()`

After all 32 workers complete, the dedup node runs once. It:

1. Calls `state["class_store"].snapshot_sync()` to get all raw `ClassRecord` objects.
2. Runs **deterministic deduplication** via `dedup_classes(records)`.
3. Optionally runs **LLM alias merging** via `merge_aliases_llm(canonical_list)` if `ENABLE_LLM_ALIAS_MERGE=true`.
4. Writes `{"deduplicated_classes": canonical_list}` back to the state for use in phases 2 and 3.

---

## 9. Step 3 — Phase 2: Data Property Extraction

**Location:** `phases/phase2_data_properties.py`

Identical fan-out pattern to Phase 1, but each worker also receives `deduplicated_classes` from Phase 1 and uses it to constrain extraction.

### Worker invocation

```python
classes_list_text = "\n".join([f"- {c.name}" for c in classes])

result = await chain.ainvoke([
    SystemMessage(content=DATA_PROPERTY_EXTRACTION_SYSTEM_PROMPT),
    HumanMessage(content=DATA_PROPERTY_EXTRACTION_USER_PROMPT.format(
        classes_list=classes_list_text,
        chunk_text=chunk.text,
    )),
])
```

The system prompt instructs the LLM to only extract properties whose `domain` is one of the provided classes. This prevents hallucinated properties that don't belong to any recognized concept.

### Extraction schema (`ExtractedDataPropertyList`)

```python
class ExtractedDataProperty(BaseModel):
    name: str           # camelCase (e.g. "loanAmount")
    domain_class: str   # must be one of the known classes
    range_xsd: str      # XSD type: "xsd:string", "xsd:decimal", etc.
    description: str
```

### Dedup (`data_property_dedup_node`)

Groups raw `DataPropertyRecord` objects by `normalize(name) + "::" + normalize(domain)`. For records in the same bucket, picks:
- Most frequent name spelling as canonical
- Most specific XSD range type (date > decimal > integer > string)
- Longest description

---

## 10. Step 4 — Phase 3: Object Property Extraction

**Location:** `phases/phase3_object_properties.py`

Same pattern as Phase 2. The extraction schema captures relationships between two classes:

```python
class ExtractedObjectProperty(BaseModel):
    name: str           # camelCase verb (e.g. "hasCustomer", "managedBy")
    domain_class: str   # source class
    range_class: str    # target class
    description: str
    inverse_of: Optional[str]  # e.g. "hasCustomer" ↔ "isCustomerOf"
```

**Dedup bucket key:** `normalize(name) + "::" + normalize(domain) + "::" + normalize(range)`

This means the same property name between different class pairs is kept as separate entries (intentional — `hasDocument` between `Loan→Contract` and `Bank→Report` are semantically distinct).

---

## 11. Step 5 — Phase 4: Deterministic Assembly

**Location:** `phases/phase4_assembly.py`, `assembly/`  
**Technology:** `rdflib`  
**No LLM calls in this phase.**

Phase 4 takes the three canonical lists from the state and builds an in-memory RDF graph, then writes it to four output formats.

### 11.1 IRI Generation — `iri_utils.py`

Class IRIs are generated from canonical names by:

1. Stripping diacritics (`É` → `E`)
2. Splitting on non-alphanumeric characters
3. Capitalizing each part and joining (PascalCase)
4. Prepending a digit guard if the first character is numeric (`123Abc` → `N123Abc`)

Example:
```
"Financial Instrument" → "FinancialInstrument"
→ IRI: https://talan.com/ontology/bpi#FinancialInstrument
```

Property IRIs use the same logic but lowercase the first letter (camelCase).

### 11.2 RDF Graph Construction — `ontology_builder.py`

The graph declares:

**Classes:**
```turtle
bpi:LoanContract a owl:Class ;
    rdfs:label "LoanContract" ;
    rdfs:comment "A contract governing the terms of a loan." ;
    rdfs:subClassOf bpi:FinancialContract .
```

**Data Properties:**
```turtle
bpi:loanAmount a owl:DatatypeProperty ;
    rdfs:label "loanAmount" ;
    rdfs:domain bpi:LoanContract ;
    rdfs:range xsd:decimal .
```

**Object Properties:**
```turtle
bpi:hasCustomer a owl:ObjectProperty ;
    rdfs:label "hasCustomer" ;
    rdfs:domain bpi:LoanContract ;
    rdfs:range bpi:Borrower ;
    owl:inverseOf bpi:isCustomerOf .
```

Any property referencing a class not in the canonical set is silently skipped with a warning log.

### 11.3 Output Serialization

| Writer | Format | Notes |
|---|---|---|
| `classes_json_writer.py` | JSON (nested tree) | Recursive `subclasses` array, cycle-safe |
| `classes_markdown_writer.py` | Markdown bullet list | Indented by depth in hierarchy |
| `turtle_writer.py` | Turtle (`.ttl`) | `rdflib` built-in serializer |
| `owl_writer.py` | OWL/XML (`.owl`) | `rdflib` built-in serializer |

---

## 12. Deduplication System

**Location:** `dedup/deterministic.py`, `dedup/llm_alias_merger.py`

### 12.1 Why Deduplication Is Needed

Multiple chunks from the same or related documents often produce the same concept under slightly different names:
- `"LoanContract"` and `"Loan Contract"` and `"loancontract"` — all the same class
- `"startDate"` on `"Loan"` from chunk 3 and on `"LoanAgreement"` from chunk 7 — may be the same property on the same (differently-named) class

Without deduplication, the ontology would contain hundreds of redundant entries.

### 12.2 Deterministic Pass

For each record type, the normalizer strips diacritics, removes all non-alphanumeric characters, and lowercases. Records with the same normalized key are grouped into one bucket.

```python
def _normalize_name(name: str) -> str:
    # "Loan Contract" → "loancontract"
    # "LoanAgreement" → "loanagreement"  (different bucket)
    name = strip_diacritics(name)
    name = re.sub(r'[\W_]+', '', name)
    return name.lower()
```

Within each bucket, the canonical name is chosen as **the most frequently occurring spelling** across all raw records. The description is the **longest** among all records in the bucket.

**Type mapping:**

| Input record | Output canonical record |
|---|---|
| `ClassRecord` | `CanonicalClass` (with `parents: List[str]`, `aliases: List[str]`) |
| `DataPropertyRecord` | `CanonicalDataProperty` |
| `ObjectPropertyRecord` | `CanonicalObjectProperty` |

### 12.3 Optional LLM Alias Merge — `llm_alias_merger.py`

Deterministic dedup catches spelling/casing variants (`LoanContract` vs `loan_contract`) but **not semantic synonyms** (`Customer` vs `Client`). If `ENABLE_LLM_ALIAS_MERGE=true`, a single LLM call is made after the deterministic pass:

```
You are an expert ontologist. Look at this list of classes.
Identify which items are exact semantic synonyms (e.g. Customer and Client).
Group them, picking the best general name as the canonical_name.
If an item has no synonyms, do not include it.
```

The LLM returns a structured `LLMMergeResult` with merge groups. The pipeline then re-collapses the canonical list using these groups. This is **one LLM call** regardless of how many classes were extracted — compared to the old approach which made one call per class.

---

## 13. LLM Client — Rate Limiting & Concurrency

**Location:** `llm/llm_factory.py`, `llm/retry.py`, `llm/concurrency.py`

### 13.1 Multi-Key Load Distribution

Three Azure OpenAI endpoints are configured (`API_KEY_1/2/3` + `API_BASE_1/2/3`). Each parallel worker is assigned to a key by `worker_id % 3`. Chunk 0 → key 1, chunk 1 → key 2, chunk 2 → key 3, chunk 3 → key 1, and so on.

The `get_worker_llm(worker_id)` function is `@lru_cache`-decorated, so each key's `ChatLiteLLM` client is constructed once and reused.

### 13.2 `SemaphoreWrappedLLM`

The raw `ChatLiteLLM` is wrapped in a `SemaphoreWrappedLLM` that intercepts every `with_structured_output()` call and wraps the resulting chain in two layers:

```
Request
  └─▶ asyncio.Semaphore (MAX_CONCURRENT_PER_KEY=50)
        └─▶ tenacity retry (on HTTP 429 only)
              └─▶ ChatLiteLLM.ainvoke()
```

This ensures no more than 50 concurrent requests hit a single key, and any 429 responses trigger exponential backoff instead of immediately failing the chunk.

### 13.3 Retry Policy — `retry.py`

```python
@retry(
    retry=retry_if_exception(_is_rate_limit_error),  # HTTP 429 only
    wait=wait_exponential(multiplier=1, max=30),       # 1s, 2s, 4s... capped at 30s
    stop=stop_after_attempt(5),
    reraise=True,
)
async def _do_call(): ...
```

**Non-429 errors** (authentication, model errors, timeout) are **not retried** — they raise immediately and the worker logs the error and continues to the next chunk. This prevents the pipeline from hanging on a permanently broken endpoint.

### 13.4 `AsyncAppendOnlyStore` Thread Safety

All parallel worker coroutines write into the same `AsyncAppendOnlyStore[T]`. The store uses a single `asyncio.Lock` to serialize appends. Since all workers run in a single Python event loop (via `asyncio`), there is no true multi-threading — only cooperative concurrency — but the lock is still needed because any coroutine can be interrupted at an `await` point.

---

## 14. Output Files

### `classes.json`

A nested tree where each node represents one canonical class:

```json
{
  "ontology_iri": "https://talan.com/ontology/bpi",
  "generated_at": "2026-05-05T20:56:02Z",
  "classes": [
    {
      "name": "FinancialInstrument",
      "iri": "https://talan.com/ontology/bpi#FinancialInstrument",
      "description": "A tradable asset representing a monetary contract.",
      "subclasses": [
        {
          "name": "Bond",
          "iri": "https://talan.com/ontology/bpi#Bond",
          "description": "...",
          "subclasses": []
        }
      ]
    }
  ]
}
```

### `classes.md`

Human-readable hierarchy using bullet indentation:

```markdown
- **FinancialInstrument** — A tradable asset...
  - **Bond** — A fixed-income instrument...
  - **Equity** — ...
```

### `ontology.ttl`

W3C standard Turtle serialization of the complete OWL TBox. Namespaces are bound to `bpi:` for the domain prefix, `owl:`, `rdfs:`, and `xsd:`.

### `ontology.owl`

OWL/XML format of the same graph — compatible with tools like Protégé, SPARQL endpoints, and OWL reasoners.

---

## 15. Performance Characteristics

### Before Optimization (ReAct agents)

| Stage | Method | LLM calls |
|---|---|---|
| Extraction (per chunk) | ReAct loop (5–8 tool calls) | ~5–8 per chunk × 79 chunks = ~400–630 total |
| Deduplication (per record) | ReAct loop (1 tool call each) | ~210 calls for 207 classes |
| **Total** | | **~600–840 LLM calls** |
| **Runtime** | | **17–35 minutes** |

### After Optimization (Structured Output + Deterministic Dedup)

| Stage | Method | LLM calls |
|---|---|---|
| Extraction (per chunk) | Single `with_structured_output()` call | 1 per chunk × 32 chunks = 32 total |
| Deduplication | Deterministic Python grouping | 0 LLM calls |
| Alias merge (optional) | Single LLM call for all classes | 1 call |
| **Total** | | **~33 LLM calls** |
| **Runtime** | | **< 6 minutes** (with 1 of 3 keys working) |

The reduction from ~800 to ~33 LLM calls (a **24× improvement**) is the primary driver of the speedup. Parallelism across 3 API keys provides an additional **3× throughput** boost on top of that.

---

## 16. Configuration Reference

All settings live in `.env` and are loaded by `PipelineConfig(BaseSettings)`:

| Variable | Default | Description |
|---|---|---|
| `API_KEY_1/2/3` | _(required)_ | Azure OpenAI API keys for the 3 parallel workers |
| `API_BASE_1/2/3` | _(required)_ | Azure OpenAI endpoint URLs (must include `api-version`) |
| `LITELLM_MODEL` | `azure/gpt-5.4-nano` | LiteLLM model identifier |
| `LITELLM_TEMPERATURE` | `0.0` | Temperature (0 = deterministic extraction) |
| `LITELLM_MAX_TOKENS` | `4096` | Max tokens per LLM response |
| `LITELLM_REQUEST_TIMEOUT` | `120` | Per-request timeout in seconds |
| `CHUNK_SIZE` | `60000` | Max characters per text chunk |
| `CHUNK_OVERLAP` | `1500` | Overlap in characters between adjacent chunks |
| `MAX_CONCURRENT_PER_KEY` | `50` | Max simultaneous requests per API key |
| `LLM_RETRY_MAX_ATTEMPTS` | `5` | Max retry attempts on HTTP 429 |
| `LLM_RETRY_MAX_BACKOFF_S` | `30` | Maximum backoff interval in seconds |
| `ENABLE_LLM_ALIAS_MERGE` | `true` | Enable single-call LLM synonym merge after deterministic dedup |
| `PREPROCESSED_DIR` | `data/output_markdowns` | Input directory for preprocessed Markdown files |
| `OUTPUT_DIR` | `data/ontology_output` | Output directory for all 4 generated files |
| `ONTOLOGY_BASE_IRI` | `https://talan.com/ontology/bpi#` | Base IRI for all ontology terms |
| `ONTOLOGY_PREFIX` | `bpi` | Turtle/SPARQL namespace prefix |
| `PIPELINE_LOG_LEVEL` | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`) |
