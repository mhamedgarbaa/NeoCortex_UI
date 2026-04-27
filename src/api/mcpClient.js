/**
 * Browser-side MCP client for the Cognee MCP Wrapper (mcp_wrapper.py).
 *
 * Transport:  JSON-RPC 2.0 — POST /mcp
 * Response:   SSE envelope  data: {...}\n\n
 * Session:    initialize → mcp-session-id header → notifications/initialized → tools/call
 *
 * All requests go through Vite's dev proxy (/mcp → localhost:8002) so there
 * are no CORS issues reading the mcp-session-id response header.
 */

// In dev the Vite proxy forwards /mcp → http://localhost:8002/mcp.
// In production point this at wherever the wrapper lives.
export const MCP_BASE        = ''          // empty = same-origin (proxied by Vite)
export const MCP_BASE_DISPLAY = 'http://localhost:8002'   // for UI labels only
const MCP_ENDPOINT = '/mcp'

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  Accept:         'application/json, text/event-stream',
}

// ── SSE parser ────────────────────────────────────────────────────────────────
function parseSSE(body) {
  for (const line of body.split('\n')) {
    const trimmed = line.trimEnd()
    if (trimmed.startsWith('data:')) {
      const json = trimmed.slice(5).trim()
      if (json) return JSON.parse(json)
    }
  }
  throw new Error(`No SSE data line found in response:\n${body.slice(0, 300)}`)
}

// ── MCP client singleton ──────────────────────────────────────────────────────
class MCPClient {
  constructor() {
    this.sessionId = null
    this._id       = 0
  }

  _nid() { return ++this._id }

  get connected() { return this.sessionId !== null }

  /**
   * Full MCP handshake:
   *   1. POST initialize  → get mcp-session-id from response header
   *   2. POST notifications/initialized  (required by the wrapper before tool calls)
   */
  async initialize() {
    // ── Step 1: initialize ────────────────────────────────────────────────────
    const resp = await fetch(MCP_ENDPOINT, {
      method:  'POST',
      headers: MCP_HEADERS,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id:      this._nid(),
        method:  'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities:    {},
          clientInfo:      { name: 'neocortex-ui', version: '1.0' },
        },
      }),
    })

    if (!resp.ok) throw new Error(`MCP initialize HTTP ${resp.status}: ${resp.statusText}`)

    // Session ID is in the response header (same-origin via proxy → readable now)
    this.sessionId = resp.headers.get('mcp-session-id') ?? '__stateless__'

    // ── Step 2: notifications/initialized ────────────────────────────────────
    // The wrapper requires this before accepting any tools/call requests.
    try {
      await fetch(MCP_ENDPOINT, {
        method:  'POST',
        headers: this._headers(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method:  'notifications/initialized',
          params:  {},
        }),
      })
    } catch {
      // Non-fatal — server may accept tool calls anyway
    }

    return this.sessionId
  }

  /** Build request headers, injecting session ID when we have a real one. */
  _headers() {
    const h = { ...MCP_HEADERS }
    if (this.sessionId && this.sessionId !== '__stateless__') {
      h['mcp-session-id'] = this.sessionId
    }
    return h
  }

  /** Disconnect / clear session. */
  disconnect() { this.sessionId = null; this._id = 0 }

  /**
   * Call an MCP tool.
   * @param {string} tool       — tool name
   * @param {object} args       — tool arguments
   * @param {number} timeoutMs  — abort after this many ms (default 120 s)
   * @returns {Promise<string>} — text content from the tool result
   */
  async call(tool, args = {}, timeoutMs = 120_000) {
    if (!this.sessionId) throw new Error('Not initialized — call initialize() first')

    const controller = new AbortController()
    const timer      = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const resp = await fetch(MCP_ENDPOINT, {
        method:  'POST',
        headers: this._headers(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id:      this._nid(),
          method:  'tools/call',
          params:  { name: tool, arguments: args },
        }),
        signal: controller.signal,
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)

      const body = await resp.text()
      const data = parseSSE(body)

      if (data.error) {
        const e = data.error
        throw new Error(`MCP error [${e.code}]: ${e.message}`)
      }

      const content = data?.result?.content ?? []
      const parts   = content
        .filter((item) => item?.type === 'text' && item.text)
        .map((item) => item.text)

      return parts.length ? parts.join('\n') : JSON.stringify(data?.result ?? {})
    } finally {
      clearTimeout(timer)
    }
  }
}

export const mcpClient = new MCPClient()

// ── Named tool helpers (arg mapping matches mcp_wrapper.py dispatch) ──────────

export const mcp = {
  /** Full MCP handshake — initialize + notifications/initialized. */
  connect: () => mcpClient.initialize(),

  disconnect: () => mcpClient.disconnect(),

  /** GRAPH_COMPLETION search (default). */
  search: (query, searchType = 'GRAPH_COMPLETION') =>
    mcpClient.call('search', { search_query: query, search_type: searchType }, 180_000),

  /** Deep graph processing — entity extraction + relationship mapping. */
  cognify: (data, temporal = false) =>
    mcpClient.call('cognify', temporal ? { data, temporal: true } : { data }, 300_000),

  /** Quick note save (routes to cognify internally per wrapper code). */
  saveInteraction: (data) =>
    mcpClient.call('save_interaction', { data }, 60_000),

  /** List all datasets in the graph. */
  listData: () =>
    mcpClient.call('list_data', {}, 30_000),

  /** Wipe ALL stored knowledge — irreversible. */
  prune: () =>
    mcpClient.call('prune', {}, 60_000),

  /** Check whether the cognify pipeline is still running. */
  cognifyStatus: () =>
    mcpClient.call('cognify_status', {}, 30_000),

  /** Add temporal Event nodes to an existing dataset. */
  memify: (dataset = 'main_dataset') =>
    mcpClient.call('memify', { dataset }, 300_000),

  /** Render the full graph as an interactive HTML file. */
  visualizeGraph: () =>
    mcpClient.call('visualize_graph', {}, 60_000),

  /** Persist a conversation transcript as graph nodes. */
  persistSessions: (data) =>
    mcpClient.call('persist_sessions', { data }, 120_000),
}
