import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'

/**
 * BrainCore — a decorative, always-visible central brain visualization
 * that reacts to the current pipeline stage. Rendered as a fixed layer
 * behind the panels.
 */
const stageLight = {
  idle:     { color: '#22D3EE', label: 'Idle' },
  query:    { color: '#22D3EE', label: 'Parsing query'  },
  ontology: { color: '#3B82F6', label: 'Traversing ontology' },
  cognee:   { color: '#A855F7', label: 'Recalling temporal memory' },
  graphrag: { color: '#10D9A0', label: 'Expanding community neighborhoods' },
  adapter:  { color: '#22D3EE', label: 'Compressing context' },
  agent:    { color: '#F59E0B', label: 'Dispatching to agent' },
  done:     { color: '#10D9A0', label: 'Response ready' },
}

export default function BrainCore() {
  const stage = useNeocortex((s) => s.pipelineStage)
  const { color, label } = stageLight[stage] || stageLight.idle

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
      aria-hidden
    >
      <div className="relative w-[620px] h-[620px] opacity-[0.18]">
        {/* Outer orbits */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: color,
              opacity: 0.35 - i * 0.08,
              scale: 1 - i * 0.16,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 40 + i * 10, repeat: Infinity, ease: 'linear' }}
          />
        ))}

        {/* Hemispheres */}
        <motion.div
          className="absolute inset-[22%] rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle at 30% 30%, ${color}88, transparent 60%)` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-[22%] rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle at 70% 70%, ${color}66, transparent 60%)` }}
          animate={{ scale: [1.05, 1, 1.05] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Core */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 80, height: 80,
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
            boxShadow: `0 0 80px ${color}`,
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Stage label — faint, mono */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-70">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.25em]"
          style={{ color }}
        >
          ● {label}
        </span>
      </div>
    </div>
  )
}
