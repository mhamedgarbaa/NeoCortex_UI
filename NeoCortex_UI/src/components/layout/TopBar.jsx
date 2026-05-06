import { motion } from 'framer-motion'
import PulseDot from '../ui/PulseDot.jsx'
import GlowButton from '../ui/GlowButton.jsx'
import { useNeocortex } from '../../store/useNeocortex.js'

function Vital({ label, value, tone = 'cyan' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/5 bg-void-700/40">
      <PulseDot tone={tone} size={7} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-300">{label}</span>
        <span className="text-xs font-mono text-ink-100">{value}</span>
      </div>
    </div>
  )
}

export default function TopBar() {
  const replayMode = useNeocortex((s) => s.replayMode)
  const setReplay = useNeocortex((s) => s.setReplayMode)
  const debug = useNeocortex((s) => s.debugMode)
  const toggleDebug = useNeocortex((s) => s.toggleDebug)

  return (
    <header className="relative z-20 flex items-center justify-between px-5 h-14
                       border-b border-white/5 bg-void-900/80 backdrop-blur-xl">
      {/* LOGO */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="relative w-8 h-8"
        >
          <div className="absolute inset-0 rounded-full border border-cortex-cyan/40" />
          <div className="absolute inset-1 rounded-full border border-cortex-purple/40" />
          <div className="absolute inset-2 rounded-full border border-cortex-green/40" />
          <div className="absolute inset-[14px] rounded-full bg-cortex-cyan shadow-glow-cyan" />
        </motion.div>
        <div className="leading-tight">
          <h1 className="font-display font-semibold text-[15px] tracking-wide text-ink-100">
            Neocortex
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
            cognitive · operating · system
          </p>
        </div>
      </div>

      {/* VITALS */}
      <div className="hidden lg:flex items-center gap-2">
        <Vital label="Ontology"  value="412 concepts" tone="blue" />
        <Vital label="Memory"    value="1.2M edges"   tone="purple" />
        <Vital label="GraphRAG"  value="18 clusters"  tone="green" />
        <Vital label="Agent"     value="MCP · Ready"  tone="amber" />
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <GlowButton tone={debug ? 'amber' : 'ghost'} size="sm" onClick={toggleDebug}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Debug
        </GlowButton>
        <GlowButton tone={replayMode ? 'cyan' : 'ghost'} size="sm" onClick={() => setReplay(!replayMode)}>
          ▶ Thought Replay
        </GlowButton>
      </div>
    </header>
  )
}
