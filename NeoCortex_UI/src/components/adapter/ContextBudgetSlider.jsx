import { useNeocortex } from '../../store/useNeocortex.js'
import { motion } from 'framer-motion'

const levels = [
  { id: 'minimal',  label: 'Minimal',  hint: '~1k tk',  tone: 'green' },
  { id: 'balanced', label: 'Balanced', hint: '~2k tk',  tone: 'cyan'  },
  { id: 'rich',     label: 'Rich',     hint: '~4k tk',  tone: 'purple'},
]

const toneText = { green: 'text-cortex-green', cyan: 'text-cortex-cyan', purple: 'text-cortex-purple' }
const toneBg   = { green: 'bg-cortex-green/15 shadow-glow-green',
                   cyan:  'bg-cortex-cyan/15  shadow-glow-cyan',
                   purple:'bg-cortex-purple/15 shadow-glow-purple' }

export default function ContextBudgetSlider() {
  const budget = useNeocortex((s) => s.contextBudget)
  const set = useNeocortex((s) => s.setContextBudget)

  return (
    <div className="px-3.5 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
          Context budget
        </p>
        <span className="text-[10px] font-mono text-ink-400">compression preset</span>
      </div>

      <div className="relative grid grid-cols-3 gap-1 p-1 rounded-lg bg-void-700/70 border border-white/5">
        {levels.map((l) => {
          const active = l.id === budget
          return (
            <button
              key={l.id}
              onClick={() => set(l.id)}
              className={[
                'relative py-1.5 rounded-md text-center transition',
                active ? `${toneBg[l.tone]} ${toneText[l.tone]}` : 'text-ink-300 hover:text-ink-100',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="budget-pill"
                  className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative text-[11px] font-mono uppercase tracking-wider">
                {l.label}
              </span>
              <span className="relative block text-[9px] font-mono opacity-70 mt-0.5">
                {l.hint}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
