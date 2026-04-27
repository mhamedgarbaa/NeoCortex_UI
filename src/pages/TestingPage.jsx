import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../store/useNeocortex.js'
import { connectivityAPI } from '../api/connectivity.js'
import { mcp, MCP_BASE_DISPLAY as MCP_BASE } from '../api/mcpClient.js'

// ── Reusable status dot ──────────────────────────────────────────────────────
function StatusDot({ status }) {
  return (
    <span className={
      status === 'connected'    ? 'dot-online'
      : status === 'syncing'    ? 'dot-syncing'
      : status === 'error'      ? 'dot-error'
      : 'dot-offline'
    } />
  )
}

// ── Connection status card ───────────────────────────────────────────────────
function ConnectionStatus() {
  const status    = useNeocortex((s) => s.cogneeStatus)
  const stats     = useNeocortex((s) => s.cogneeStats)
  const pingMs    = useNeocortex((s) => s.cogneePingMs)
  const connect   = useNeocortex((s) => s.connectCognee)
  const disconnect= useNeocortex((s) => s.disconnectCognee)

  const connected = status === 'connected'
  const syncing   = status === 'syncing'

  const statusLabel = {
    connected:    'Connected',
    disconnected: 'Disconnected',
    syncing:      'Connecting…',
    error:        'Connection failed',
  }[status] ?? status

  const statusClass = {
    connected:    'badge-green',
    disconnected: 'badge-gray',
    syncing:      'badge-amber',
    error:        'badge-rose',
  }[status] ?? 'badge-gray'

  return (
    <div className="card-md p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200
                          flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-900">Cognee MCP Server</p>
            <p className="text-xs text-slate-400 font-mono">REST :8001 · MCP :8002</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && pingMs != null && (
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {pingMs}ms
            </span>
          )}
          <span className={statusClass}>
            <StatusDot status={status} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <AnimatePresence>
        {connected && stats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Entities',       value: stats.entities      },
                { label: 'Relations',      value: stats.relations     },
                { label: 'Memified nodes', value: stats.memifiedNodes },
                { label: 'Last sync',      value: new Date(stats.lastSync).toLocaleTimeString() },
              ].map(({ label, value }) => (
                <div key={label} className="card-inset p-3 text-center">
                  <p className="text-sm font-semibold font-mono text-slate-800">{value}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {stats.ontologyPath && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg
                              bg-purple-50 border border-purple-200 text-xs font-mono">
                <span className="text-purple-500">📂</span>
                <span className="text-purple-700 truncate">{stats.ontologyPath}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {status === 'error' && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          Could not reach MCP at <span className="font-mono">:8002</span> or REST at{' '}
          <span className="font-mono">:8001</span> — make sure the Cognee server is running.
        </div>
      )}

      {/* Spinner */}
      {syncing && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
          <svg className="animate-spin w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                    strokeDasharray="60" strokeDashoffset="20"/>
          </svg>
          Establishing connection…
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {connected ? (
          <>
            <button onClick={disconnect}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-500
                         hover:border-slate-300 hover:text-slate-700 transition font-medium">
              Disconnect
            </button>
            <button onClick={connect}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition
                         bg-purple-50 text-purple-700 border border-purple-200
                         hover:bg-purple-100">
              ↺ Re-ping
            </button>
          </>
        ) : (
          <button onClick={connect} disabled={syncing}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition
                       bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-sm">
            {syncing ? 'Connecting…' : '⟳ Connect'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Result viewer ────────────────────────────────────────────────────────────
function ResultViewer({ result, onClear }) {
  if (!result) return null
  const isSuccess = result.status === 'success'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isSuccess ? 'border-emerald-200' : 'border-rose-200'
      }`}
    >
      <div className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium
                       ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        <span>
          {result.type === 'ingest' ? '📥 Ingest result' : '🔍 Search result'}
          &nbsp;·&nbsp;
          {isSuccess ? 'Success' : 'Failed'}
        </span>
        <button onClick={onClear} className="opacity-60 hover:opacity-100 transition">✕ clear</button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-700 bg-white overflow-auto max-h-64 scrollbar-thin">
        {JSON.stringify(result, null, 2)}
      </pre>
    </motion.div>
  )
}

// ── Test action button ───────────────────────────────────────────────────────
function TestButton({ label, description, accentClass, borderClass, bgClass, hoverClass, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 rounded-xl border text-left transition group
                  ${borderClass} ${bgClass} ${hoverClass} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <p className={`font-semibold text-sm ${accentClass}`}>{label}</p>
      <p className="text-xs text-slate-500 mt-1 leading-snug">{description}</p>
    </button>
  )
}

// ── Endpoint reference table ─────────────────────────────────────────────────
const ENDPOINTS = [
  { method: 'GET',  path: ':8001/health',        purpose: 'REST — server health check + version' },
  { method: 'GET',  path: ':8001/graph/stats',   purpose: 'REST — entity / relation counts' },
  { method: 'GET',  path: ':8001/ontology/info', purpose: 'REST — active ontology metadata' },
  { method: 'POST', path: ':8002/mcp → initialize',   purpose: 'MCP — start session, returns mcp-session-id' },
  { method: 'POST', path: ':8002/mcp → search',       purpose: 'MCP — GRAPH_COMPLETION search' },
  { method: 'POST', path: ':8002/mcp → cognify',      purpose: 'MCP — ingest & build knowledge graph' },
  { method: 'POST', path: ':8002/mcp → list_data',    purpose: 'MCP — list datasets' },
  { method: 'POST', path: ':8002/mcp → cognify_status', purpose: 'MCP — check pipeline progress' },
  { method: 'POST', path: ':8002/mcp → memify',       purpose: 'MCP — add temporal Event nodes' },
  { method: 'POST', path: ':8002/mcp → prune',        purpose: 'MCP — wipe all stored knowledge' },
]

// ── MCP session card ─────────────────────────────────────────────────────────
function MCPSessionStatus() {
  const mcpStatus    = useNeocortex((s) => s.mcpStatus)
  const mcpSessionId = useNeocortex((s) => s.mcpSessionId)

  const label = {
    connected:    'Session active',
    disconnected: 'No session',
    connecting:   'Initialising…',
    error:        'Session failed',
  }[mcpStatus] ?? mcpStatus

  const badgeClass = {
    connected:    'badge-green',
    disconnected: 'badge-gray',
    connecting:   'badge-amber',
    error:        'badge-rose',
  }[mcpStatus] ?? 'badge-gray'

  const dotClass = {
    connected:    'dot-online',
    disconnected: 'dot-offline',
    connecting:   'dot-syncing',
    error:        'dot-error',
  }[mcpStatus] ?? 'dot-offline'

  return (
    <div className="card-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200
                          flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-900">Cognee MCP Server</p>
            <p className="text-xs text-slate-400 font-mono">{MCP_BASE}/mcp</p>
          </div>
        </div>
        <span className={badgeClass}>
          <StatusDot status={mcpStatus === 'connecting' ? 'syncing' : mcpStatus} />
          {label}
        </span>
      </div>
      {mcpStatus === 'connected' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono">
          <span className="text-blue-500">{mcpSessionId ? 'session-id' : 'mode'}</span>
          <span className="text-blue-700 truncate">{mcpSessionId ?? 'stateless'}</span>
        </div>
      )}
      {mcpStatus === 'error' && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          Could not initialise MCP session at{' '}
          <span className="font-mono">{MCP_BASE}/mcp</span> — check the server is running.
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TestingPage() {
  const connected    = useNeocortex((s) => s.cogneeStatus === 'connected')
  const mcpConnected = useNeocortex((s) => s.mcpStatus === 'connected')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)

  async function runTest(fn) {
    setLoading(true)
    setResult(null)
    try {
      const r = await fn()
      setResult(r)
    } catch (err) {
      setResult({ status: 'error', error: err.message })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="page-title">Cognee Testing Console</h1>
        <p className="page-sub mt-1">
          Test connectivity and operations against REST{' '}
          <span className="font-mono text-slate-600">:8001</span>
          {' '}and MCP{' '}
          <span className="font-mono text-slate-600">:8002</span>
        </p>
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionStatus />
        <MCPSessionStatus />
      </div>

      {/* Test actions */}
      <div className="space-y-3">
        <h2 className="section-title">Operations</h2>

        {!connected && !mcpConnected && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            Connect to the Cognee server above before running tests.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TestButton
            label="🧠 MCP Cognify"
            description="Call cognify tool — ingest a test document into the knowledge graph"
            accentClass="text-purple-700" borderClass="border-purple-200"
            bgClass="bg-purple-50"       hoverClass="hover:bg-purple-100"
            disabled={!mcpConnected || loading}
            onClick={() => runTest(async () => {
              const r = await mcp.cognify('Test document: Neocortex UI connectivity verification ' + new Date().toISOString())
              return { status: 'success', type: 'ingest', tool: 'cognify', response: r }
            })}
          />
          <TestButton
            label="🔍 MCP Search"
            description='Call search tool — GRAPH_COMPLETION query "test connectivity"'
            accentClass="text-emerald-700" borderClass="border-emerald-200"
            bgClass="bg-emerald-50"        hoverClass="hover:bg-emerald-100"
            disabled={!mcpConnected || loading}
            onClick={() => runTest(async () => {
              const r = await mcp.search('test connectivity')
              return { status: 'success', type: 'ingest', tool: 'search', response: r }
            })}
          />
          <TestButton
            label="📋 MCP List Data"
            description="Call list_data tool — enumerate all datasets in the graph"
            accentClass="text-blue-700" borderClass="border-blue-200"
            bgClass="bg-blue-50"        hoverClass="hover:bg-blue-100"
            disabled={!mcpConnected || loading}
            onClick={() => runTest(async () => {
              const r = await mcp.listData()
              return { status: 'success', tool: 'list_data', response: r }
            })}
          />
          <TestButton
            label="📊 REST Graph Stats"
            description="GET :8001/graph/stats — entity and relation counts"
            accentClass="text-amber-700" borderClass="border-amber-200"
            bgClass="bg-amber-50"        hoverClass="hover:bg-amber-100"
            disabled={!connected || loading}
            onClick={() => runTest(() => connectivityAPI.getGraphStats()
              .then((r) => ({ status: r ? 'success' : 'failed', tool: 'REST /graph/stats', response: r })))}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                    strokeDasharray="60" strokeDashoffset="20"/>
          </svg>
          Running test…
        </div>
      )}

      {/* Result viewer */}
      <ResultViewer result={result} onClear={() => setResult(null)} />

      {/* Endpoint reference */}
      <div className="space-y-3">
        <h2 className="section-title">Endpoint Reference</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400 w-16">
                  Method
                </th>
                <th className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400">
                  Path
                </th>
                <th className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep, i) => (
                <tr key={ep.path}
                    className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-xs font-semibold
                      ${ep.method === 'GET' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{ep.path}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{ep.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
