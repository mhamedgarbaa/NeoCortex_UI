import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'
import PulseDot from '../ui/PulseDot.jsx'
import GlowButton from '../ui/GlowButton.jsx'

const toneFor = (status) =>
  status === 'done' ? 'green' : status === 'active' ? 'blue' : 'gray'

export default function PipelineTracker() {
  const steps = useNeocortex((s) => s.ontologySteps)
  const advance = useNeocortex((s) => s.advanceOntology)

  return (
    <div className="px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
          Preprocessing pipeline
        </p>
        <GlowButton tone="blue" size="sm" onClick={advance}>
          ▷ Step
        </GlowButton>
      </div>

      <ol className="relative pl-4 space-y-2.5 border-l border-white/5">
        {steps.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative"
          >
            <span className="absolute -left-[9px] top-1.5">
              <PulseDot
                tone={toneFor(s.status)}
                size={8}
                animate={s.status === 'active'}
              />
            </span>

            <div className="flex items-center justify-between">
              <span
                className={[
                  'text-xs',
                  s.status === 'done'    && 'text-ink-200',
                  s.status === 'active'  && 'text-cortex-blue',
                  s.status === 'queued'  && 'text-ink-400',
                ].filter(Boolean).join(' ')}
              >
                {s.label}
              </span>
              <span className="font-mono text-[10px] text-ink-300">
                {s.status === 'done' ? '100%' : s.status === 'active' ? `${s.progress}%` : '—'}
              </span>
            </div>

            {/* progress bar */}
            <div className="mt-1 h-1 w-full rounded-full bg-void-700 overflow-hidden">
              <motion.div
                className={[
                  'h-full rounded-full',
                  s.status === 'done'   ? 'bg-cortex-green'
                  : s.status === 'active' ? 'bg-cortex-blue'
                  : 'bg-white/5',
                ].join(' ')}
                initial={{ width: 0 }}
                animate={{ width: `${s.progress}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
              />
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
