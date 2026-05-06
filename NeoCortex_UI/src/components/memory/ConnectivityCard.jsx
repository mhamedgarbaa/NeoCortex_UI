import { motion, AnimatePresence } from 'framer-motion'
import PulseDot from '../ui/PulseDot.jsx'
import GlowButton from '../ui/GlowButton.jsx'

const STATUS_CFG = {
  connected:    { tone: 'green',  label: 'Connected',    dot: 'green'  },
  disconnected: { tone: 'ghost',  label: 'Disconnected', dot: 'gray'   },
  syncing:      { tone: 'cyan',   label: 'Connecting…',  dot: 'cyan'   },
  error:        { tone: 'ghost',  label: 'Error',        dot: 'rose'   },
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] font-mono text-ink-300 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-mono text-ink-100">{value}</span>
    </div>
  )
}

export default function ConnectivityCard({
  name,
  subtitle,
  accent,           // 'purple' | 'green'
  status,           // 'connected' | 'disconnected' | 'syncing' | 'error'
  pingMs,
  stats,            // object of { label: value }
  onConnect,
  onDisconnect,
  ontologyPath,     // shown only on Cognee card
}) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.disconnected
  const connected = status === 'connected'
  const syncing   = status === 'syncing'

  const accentText = {
    purple: 'text-cortex-purple',
    green:  'text-cortex-green',
  }[accent] || 'text-cortex-cyan'

  const accentBorder = {
    purple: 'border-cortex-purple/20',
    green:  'border-cortex-green/20',
  }[accent] || 'border-white/10'

  const accentBg = {
    purple: 'bg-cortex-purple/5',
    green:  'bg-cortex-green/5',
  }[accent] || 'bg-void-700/40'

  return (
    <div className={`rounded-xl border ${accentBorder} ${accentBg} overflow-hidden`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <PulseDot tone={cfg.dot} size={10} animate={connected || syncing} />
          </div>
          <div>
            <p className={`text-[12px] font-semibold font-display ${accentText}`}>{name}</p>
            <p className="text-[10px] font-mono text-ink-300">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ping badge */}
          {connected && pingMs && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-mono text-[10px] px-2 py-0.5 rounded-full
                         bg-cortex-green/10 text-cortex-green border border-cortex-green/25"
            >
              {pingMs}ms
            </motion.span>
          )}
          {/* Status chip */}
          <span
            className={[
              'text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border',
              connected ? 'text-cortex-green border-cortex-green/30 bg-cortex-green/8'
              : syncing ? 'text-cortex-cyan  border-cortex-cyan/30  bg-cortex-cyan/8 animate-pulse'
              : 'text-ink-300 border-white/10',
            ].join(' ')}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3 space-y-3">
        {/* Ontology path (Cognee only) */}
        {ontologyPath && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-ink-400 mb-1">
              Ontology source
            </p>
            <div className={[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md border font-mono text-[11px]',
              ontologyPath
                ? 'border-cortex-purple/25 bg-cortex-purple/8 text-cortex-purple'
                : 'border-white/8 bg-void-700/40 text-ink-400',
            ].join(' ')}>
              <span className="text-[10px]">📂</span>
              <span className="truncate">{ontologyPath || 'No file ingested yet'}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <AnimatePresence>
          {connected && stats && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5"
            >
              {Object.entries(stats).map(([k, v]) => (
                <StatRow key={k} label={k} value={String(v)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not connected placeholder */}
        {!connected && !syncing && (
          <p className="text-[11px] text-ink-400 font-mono text-center py-1">
            — no metrics available —
          </p>
        )}

        {/* Syncing indicator */}
        {syncing && (
          <div className="flex items-center gap-2 justify-center py-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-3 h-3 border border-cortex-cyan border-t-transparent rounded-full"
            />
            <span className="text-[11px] font-mono text-cortex-cyan">establishing connection…</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {connected ? (
            <GlowButton tone="ghost" size="sm" onClick={onDisconnect} className="flex-1 justify-center">
              Disconnect
            </GlowButton>
          ) : (
            <GlowButton
              tone={accent === 'purple' ? 'purple' : 'green'}
              size="sm"
              disabled={syncing}
              onClick={onConnect}
              className="flex-1 justify-center"
            >
              {syncing ? 'Connecting…' : '⟳ Connect'}
            </GlowButton>
          )}
          {connected && (
            <GlowButton tone="ghost" size="sm" onClick={onConnect} className="flex-1 justify-center">
              ↺ Ping
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  )
}
