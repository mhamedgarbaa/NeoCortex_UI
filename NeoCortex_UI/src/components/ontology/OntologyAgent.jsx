import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'
import GlowButton from '../ui/GlowButton.jsx'
import PulseDot from '../ui/PulseDot.jsx'

const kindStyle = {
  info:    'text-ink-200',
  success: 'text-cortex-green',
  warn:    'text-cortex-amber',
  done:    'text-cortex-cyan font-semibold',
}

const kindIcon = {
  info:    '›',
  success: '✓',
  warn:    '⚠',
  done:    '●',
}

export default function OntologyAgent() {
  const status  = useNeocortex((s) => s.agentStatus)
  const log     = useNeocortex((s) => s.agentLog)
  const run     = useNeocortex((s) => s.runOntologyAgent)
  const reset   = useNeocortex((s) => s.resetAgent)
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log])

  const running = status === 'running'
  const done    = status === 'done'

  return (
    <div className="px-3.5 pb-3 space-y-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseDot
            tone={done ? 'green' : running ? 'cyan' : 'gray'}
            animate={running}
            size={8}
          />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
            Ontology Agent
          </p>
          {running && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[10px] font-mono text-cortex-cyan"
            >
              thinking…
            </motion.span>
          )}
        </div>

        <div className="flex gap-2">
          {done && (
            <GlowButton tone="ghost" size="sm" onClick={reset}>
              ↺ Reset
            </GlowButton>
          )}
          <GlowButton
            tone={done ? 'green' : 'blue'}
            size="sm"
            disabled={running}
            onClick={run}
          >
            {running ? '⏳ Running…' : done ? '✓ Done' : '▷ Generate Ontology'}
          </GlowButton>
        </div>
      </div>


      {/* Agent log terminal */}
      <AnimatePresence>
        {(running || done) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="rounded-lg border border-white/8 bg-void-900/80 p-3
                         font-mono text-[11px] h-[130px] overflow-y-auto
                         scrollbar-neural space-y-1"
            >
              {log.map((line, i) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={['flex items-start gap-2', kindStyle[line.kind]].join(' ')}
                >
                  <span className="shrink-0 w-3 text-center opacity-70">
                    {kindIcon[line.kind]}
                  </span>
                  <span className="leading-snug">{line.text}</span>
                </motion.div>
              ))}

              {/* blinking cursor while running */}
              {running && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-cortex-cyan"
                >
                  █
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
