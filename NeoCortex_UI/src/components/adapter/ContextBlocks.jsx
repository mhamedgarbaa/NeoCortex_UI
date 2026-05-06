import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import NeuralCard from '../ui/NeuralCard.jsx'
import PulseDot from '../ui/PulseDot.jsx'
import { sampleBlocks } from '../../data/mockQueries.js'
import { useNeocortex } from '../../store/useNeocortex.js'

function Block({ accent, icon, title, count, children, tone }) {
  return (
    <NeuralCard accent={accent} hover className="p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <PulseDot tone={tone} size={7} />
          <span className={`text-[10px] font-mono uppercase tracking-wider ${
            accent === 'blue' ? 'text-cortex-blue'
            : accent === 'purple' ? 'text-cortex-purple'
            : accent === 'green' ? 'text-cortex-green'
            : accent === 'amber' ? 'text-cortex-amber'
            : 'text-cortex-cyan'
          }`}>
            {icon} {title}
          </span>
        </div>
        {count !== undefined && (
          <span className="text-[10px] font-mono text-ink-300">{count}</span>
        )}
      </div>
      {children}
    </NeuralCard>
  )
}

export default function ContextBlocks() {
  const [showRejected, setShowRejected] = useState(false)
  const last = useNeocortex((s) => s.lastResult)

  const b = sampleBlocks

  return (
    <div className="px-3.5 pb-3 flex-1 min-h-0 overflow-auto scrollbar-neural space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300 pt-1">
        ◎ Structured Context
        {last && <span className="text-ink-400 ml-2">for “{last.query.slice(0, 48)}…”</span>}
      </p>

      {/* Relevant Entities */}
      <Block accent="blue" tone="blue" icon="◇" title="Relevant Entities" count={`${b.entities.length} matched`}>
        <div className="flex flex-wrap gap-1.5">
          {b.entities.map((e) => (
            <motion.span
              key={e.label}
              whileHover={{ y: -1 }}
              className="px-2 py-1 rounded-md bg-void-700/60 border border-cortex-blue/30
                         text-[11px] text-ink-100 font-mono flex items-center gap-1.5"
            >
              <span className="text-cortex-blue">●</span>
              {e.label}
              <span className="text-[9px] text-ink-400">
                {(e.confidence * 100).toFixed(0)}%
              </span>
            </motion.span>
          ))}
        </div>
      </Block>

      {/* Temporal Context */}
      <Block accent="purple" tone="purple" icon="⧗" title="Temporal Context" count={`${b.temporal.length} facts`}>
        <ul className="space-y-1.5">
          {b.temporal.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2"
            >
              <span className="shrink-0 font-mono text-[10px] text-cortex-purple tabular-nums
                               px-1.5 py-0.5 rounded bg-cortex-purple/10 border border-cortex-purple/30">
                {t.t}
              </span>
              <span className="text-[12px] text-ink-100 leading-snug">{t.fact}</span>
            </motion.li>
          ))}
        </ul>
      </Block>

      {/* Community Insights */}
      <Block accent="green" tone="green" icon="☷" title="Community Insights" count={`${b.community.length} clusters`}>
        <ul className="space-y-1.5">
          {b.community.map((c, i) => (
            <li key={i} className="text-[12px] text-ink-100 leading-snug">
              <span className="text-cortex-green font-mono text-[10px] mr-1.5">[{c.cluster}]</span>
              {c.note}
            </li>
          ))}
        </ul>
      </Block>

      {/* Filtered Knowledge */}
      <Block accent="cyan" tone="cyan" icon="⌘" title="Filtered Knowledge" count="final">
        <ul className="space-y-1">
          {b.filtered.map((f, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-2 text-[12px] text-ink-100 leading-snug"
            >
              <span className="text-cortex-cyan mt-0.5">▸</span>
              {f}
            </motion.li>
          ))}
        </ul>
      </Block>

      {/* Hallucination Guard */}
      <div>
        <button
          onClick={() => setShowRejected((v) => !v)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md
                     border border-cortex-rose/20 bg-cortex-rose/5 text-cortex-rose
                     hover:bg-cortex-rose/10 transition"
        >
          <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cortex-rose animate-pulse" />
            Hallucination Guard · {b.rejected.length} filtered out
          </span>
          <span className="text-[10px] font-mono">
            {showRejected ? '− hide' : '+ reveal'}
          </span>
        </button>

        <AnimatePresence>
          {showRejected && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-1.5 space-y-1"
            >
              {b.rejected.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-md
                             bg-cortex-rose/[0.04] border border-cortex-rose/15"
                >
                  <span className="text-[11px] line-through text-ink-300">{r.fact}</span>
                  <span className="shrink-0 text-[9px] font-mono text-cortex-rose/80">
                    {r.reason}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
