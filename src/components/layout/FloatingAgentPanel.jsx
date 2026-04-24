import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import NeuralCard from '../ui/NeuralCard.jsx'
import PulseDot from '../ui/PulseDot.jsx'
import GlowButton from '../ui/GlowButton.jsx'
import { useNeocortex } from '../../store/useNeocortex.js'

function Row({ label, value, tone = 'amber' }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <div className="flex items-center gap-2 text-ink-300 font-mono uppercase tracking-wider text-[10px]">
        <PulseDot tone={tone} size={6} />
        {label}
      </div>
      <span className="font-mono text-ink-100">{value}</span>
    </div>
  )
}

export default function FloatingAgentPanel() {
  const [open, setOpen] = useState(true)
  const connected = useNeocortex((s) => s.agentConnected)
  const toggle    = useNeocortex((s) => s.toggleAgent)
  const debug     = useNeocortex((s) => s.debugMode)
  const toggleDebug = useNeocortex((s) => s.toggleDebug)
  const last      = useNeocortex((s) => s.lastResult)
  const stage     = useNeocortex((s) => s.pipelineStage)

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -400, right: 400, top: -200, bottom: 200 }}
      className="fixed bottom-5 right-5 z-40 w-[340px] cursor-grab active:cursor-grabbing"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <NeuralCard accent="amber" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5 bg-void-700/40">
          <div className="flex items-center gap-2">
            <PulseDot tone={connected ? 'amber' : 'gray'} animate={connected} size={8} />
            <div className="leading-tight">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-cortex-amber">
                Executive Cortex
              </p>
              <p className="text-[10px] text-ink-300 font-mono">
                MCP Agent · {connected ? 'live' : 'offline'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-ink-300 hover:text-ink-100 transition text-xs font-mono px-2 py-1 rounded hover:bg-white/5"
          >
            {open ? '−' : '+'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3.5 space-y-3">
                <div className="space-y-1">
                  <Row label="Agent"     value="Claude · Sonnet 4.6" />
                  <Row label="Session"   value="nx-7a42b1" tone="cyan" />
                  <Row label="Stage"     value={stage} tone={stage === 'done' ? 'green' : 'amber'} />
                  <Row label="Mem calls" value={last ? '3 · cognee, graphrag, ontology' : '—'} tone="purple" />
                  <Row
                    label="Context in"
                    value={last ? `${last.tokensFiltered.toLocaleString()} tk` : '—'}
                    tone="green"
                  />
                </div>

                <div className="hr-neural" />

                <div className="flex items-center gap-2">
                  <GlowButton
                    tone={debug ? 'amber' : 'ghost'}
                    size="sm"
                    onClick={toggleDebug}
                    className="flex-1 justify-center"
                  >
                    {debug ? 'Debug · ON' : 'Debug'}
                  </GlowButton>
                  <GlowButton
                    tone={connected ? 'ghost' : 'amber'}
                    size="sm"
                    onClick={toggle}
                    className="flex-1 justify-center"
                  >
                    {connected ? 'Disconnect' : 'Reconnect'}
                  </GlowButton>
                </div>

                {debug && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 rounded-lg border border-cortex-amber/20 bg-cortex-amber/5 p-2.5 space-y-1.5"
                  >
                    <p className="text-[10px] font-mono uppercase tracking-wider text-cortex-amber">
                      RAW → FILTERED
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-ink-300">Raw</span>
                      <span className="text-ink-100">{last?.tokensRaw?.toLocaleString() ?? '12,480'} tk</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-ink-300">Filtered</span>
                      <span className="text-cortex-green">{last?.tokensFiltered?.toLocaleString() ?? '2,040'} tk</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-ink-300">Compression</span>
                      <span className="text-cortex-cyan">
                        {last
                          ? `${((1 - last.tokensFiltered / last.tokensRaw) * 100).toFixed(0)}%`
                          : '84%'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NeuralCard>
    </motion.div>
  )
}
