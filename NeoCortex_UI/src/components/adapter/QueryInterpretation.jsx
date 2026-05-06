import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'
import { sampleBlocks } from '../../data/mockQueries.js'

export default function QueryInterpretation() {
  const last = useNeocortex((s) => s.lastResult)
  const stage = useNeocortex((s) => s.pipelineStage)
  const running = stage !== 'idle' && stage !== 'done'

  const intent = last?.intent ?? (running ? 'Parsing intent…' : 'Awaiting query')
  const entities = last?.entities ?? sampleBlocks.entities.map((e) => e.label)

  return (
    <div className="px-3.5 py-2">
      <div className="rounded-lg border border-cortex-cyan/20 bg-cortex-cyan/5 p-2.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-cortex-cyan mb-1">
          ∆ Interpreted intent
        </p>
        <motion.p
          key={intent}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-ink-100 leading-relaxed"
        >
          {intent}
        </motion.p>

        <div className="mt-2 flex flex-wrap gap-1">
          {entities.map((e) => (
            <motion.span
              key={e}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono
                         bg-cortex-cyan/10 text-cortex-cyan border border-cortex-cyan/25"
            >
              {e}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}
