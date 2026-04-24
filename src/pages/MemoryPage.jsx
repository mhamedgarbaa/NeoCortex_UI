import { motion } from 'framer-motion'
import { useNeocortex } from '../store/useNeocortex.js'

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  connected:    { dotClass: 'dot-online',  label: 'Connected',   labelClass: 'badge-green' },
  disconnected: { dotClass: 'dot-offline', label: 'Disconnected',labelClass: 'badge-gray'  },
  syncing:      { dotClass: 'dot-syncing', label: 'Connecting…', labelClass: 'badge-amber' },
  error:        { dotClass: 'dot-error',   label: 'Error',       labelClass: 'badge-rose'  },
}

// ── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
      <span className="text-xs text-ink-500 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-ink-800 font-mono">{value}</span>
    </div>
  )
}

// ── Connectivity card ────────────────────────────────────────────────────────
function ConnCard({ name, description, accentColor, accentTint, status, pingMs, stats, ontologyPath,
                    onConnect, onDisconnect }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.disconnected
  const connected = status === 'connected'
  const syncing   = status === 'syncing'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-md overflow-hidden"
    >
      {/* Card top accent stripe */}
      <div className="h-1 w-full" style={{ background: accentColor }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: accentTint }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: accentColor }} />
            </div>
            <div>
              <p className="font-display font-semibold text-ink-900">{name}</p>
              <p className="text-xs text-ink-400 mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {connected && pingMs && (
              <span className="text-xs font-mono text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full">
                {pingMs}ms
              </span>
            )}
            <span className={cfg.labelClass}>
              <span className={cfg.dotClass} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Ontology path (Cognee only) */}
        {ontologyPath !== undefined && (
          <div className="space-y-1">
            <p className="section-title">Ontology source path</p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono"
              style={{ background: accentTint, borderColor: `${accentColor}33` }}
            >
              <span style={{ color: accentColor }}>📂</span>
              <span className="truncate text-ink-700">{ontologyPath || 'No file committed yet'}</span>
            </div>
          </div>
        )}

        {/* Stats (connected) */}
        {connected && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-inset px-4 py-1 divide-y-0"
          >
            {Object.entries(stats).map(([k, v]) => (
              <StatRow key={k} label={k} value={String(v)} />
            ))}
          </motion.div>
        )}

        {/* Syncing */}
        {syncing && (
          <div className="flex items-center justify-center gap-3 py-4">
            <svg className="animate-spin w-4 h-4 text-ink-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/>
            </svg>
            <span className="text-sm text-ink-500">Establishing connection…</span>
          </div>
        )}

        {/* Disconnected placeholder */}
        {!connected && !syncing && (
          <p className="text-sm text-ink-400 text-center py-2">— no metrics available —</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {connected ? (
            <>
              <button
                onClick={onDisconnect}
                className="flex-1 py-2 rounded-lg border border-ink-200 text-sm text-ink-500
                           hover:border-ink-300 hover:text-ink-700 transition font-medium"
              >
                Disconnect
              </button>
              <button
                onClick={onConnect}
                className="flex-1 py-2 rounded-lg border text-sm font-medium transition"
                style={{ color: accentColor, borderColor: `${accentColor}33`,
                         background: accentTint }}
              >
                ↺ Ping
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={syncing}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition
                         disabled:opacity-50 shadow-sm hover:opacity-90"
              style={{ background: accentColor }}
            >
              {syncing ? 'Connecting…' : '⟳ Connect'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MemoryPage() {
  const cogneeStatus     = useNeocortex((s) => s.cogneeStatus)
  const cogneeStats      = useNeocortex((s) => s.cogneeStats)
  const cogneePingMs     = useNeocortex((s) => s.cogneePingMs)
  const connectCognee    = useNeocortex((s) => s.connectCognee)
  const disconnectCognee = useNeocortex((s) => s.disconnectCognee)

  const graphragStatus     = useNeocortex((s) => s.graphragStatus)
  const graphragStats      = useNeocortex((s) => s.graphragStats)
  const graphragPingMs     = useNeocortex((s) => s.graphragPingMs)
  const connectGraphRAG    = useNeocortex((s) => s.connectGraphRAG)
  const disconnectGraphRAG = useNeocortex((s) => s.disconnectGraphRAG)

  const ontologyPath = useNeocortex((s) => s.ontologyFilePath)
  const commitStatus = useNeocortex((s) => s.commitStatus)

  const commitPath = useNeocortex((s) => s.commitPath)
  const effectivePath = commitStatus === 'committed' ? commitPath : ontologyPath

  const cogneeStatDisplay = cogneeStats ? {
    'Entities':        cogneeStats.entities,
    'Relations':       cogneeStats.relations,
    'Memified nodes':  cogneeStats.memifiedNodes,
    'Last sync':       new Date(cogneeStats.lastSync).toLocaleTimeString(),
  } : null

  const graphragStatDisplay = graphragStats ? {
    'Communities': graphragStats.communities,
    'Nodes':       graphragStats.nodes,
    'Edges':       graphragStats.edges,
    'Last index':  new Date(graphragStats.lastIndex).toLocaleTimeString(),
  } : null

  const bothConnected = cogneeStatus === 'connected' && graphragStatus === 'connected'

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Memory Layer</h1>
          <p className="page-sub mt-1">
            Manage connectivity to Cognee and GraphRAG
          </p>
        </div>
        {bothConnected && (
          <span className="badge-green text-sm">
            <span className="dot-online" /> All systems connected
          </span>
        )}
      </div>

      {/* Architecture diagram */}
      <div className="card p-5">
        <p className="section-title mb-3">Data flow architecture</p>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {[
            { label: 'Ontology file',    color: 'text-cortex-blue',   bg: 'bg-cortex-blue-tint',   border: 'border-blue-200'   },
            null,
            { label: 'Cognee memify',    color: 'text-cortex-purple', bg: 'bg-cortex-purple-tint', border: 'border-purple-200' },
            null,
            { label: 'GraphRAG index',   color: 'text-cortex-green',  bg: 'bg-cortex-green-tint',  border: 'border-emerald-200'},
            null,
            { label: 'Context Adapter',  color: 'text-cortex-cyan',   bg: 'bg-cortex-cyan-tint',   border: 'border-cyan-200'   },
            null,
            { label: 'Agent (via MCP)',  color: 'text-cortex-amber',  bg: 'bg-cortex-amber-tint',  border: 'border-amber-200'  },
          ].map((item, i) =>
            item === null
              ? <span key={i} className="text-ink-300 text-lg font-light">→</span>
              : (
                <span key={i} className={`px-3 py-1.5 rounded-lg border font-medium text-xs ${item.bg} ${item.color} ${item.border}`}>
                  {item.label}
                </span>
              )
          )}
        </div>
        <p className="text-xs text-ink-400 mt-3 leading-relaxed">
          Cognee ingests the ontology file from the committed path, memifies entities and relations
          for temporal-aware graph traversal, and handles outdated fact detection.
          GraphRAG independently indexes community clusters for semantic neighbourhood search.
          Both systems are queried by the Context Adapter before responses reach the agent.
        </p>
      </div>

      {/* Connectivity cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="section-title px-1">Cognee · Temporal Memory</p>
          <ConnCard
            name="Cognee"
            description="Graph-based temporal memory · memification"
            accentColor="#7C3AED"
            accentTint="#F5F3FF"
            status={cogneeStatus}
            pingMs={cogneePingMs}
            stats={cogneeStatDisplay}
            ontologyPath={effectivePath}
            onConnect={connectCognee}
            onDisconnect={disconnectCognee}
          />
        </div>

        <div className="space-y-2">
          <p className="section-title px-1">GraphRAG · Community Memory</p>
          <ConnCard
            name="GraphRAG"
            description="Community-based knowledge clustering"
            accentColor="#059669"
            accentTint="#ECFDF5"
            status={graphragStatus}
            pingMs={graphragPingMs}
            stats={graphragStatDisplay}
            onConnect={connectGraphRAG}
            onDisconnect={disconnectGraphRAG}
          />
        </div>
      </div>

      {/* MCP note */}
      <div className="card p-5 border-amber-200 bg-cortex-amber-tint/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cortex-amber-tint border border-amber-200
                          flex items-center justify-center shrink-0">
            <span className="text-cortex-amber text-sm">⚡</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-ink-900 mb-1">MCP Server Integration</p>
            <p className="text-sm text-ink-500 leading-relaxed">
              Agents connect to this project through the MCP server endpoint.
              The Context Adapter queries both Cognee and GraphRAG, filters and compresses
              the retrieved context, then returns only what the agent needs — no more, no less.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
