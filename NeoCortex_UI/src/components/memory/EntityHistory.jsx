import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { entityHistory, entityList, timelinePoints } from '../../data/mockMemory.js'
import NeuralCard from '../ui/NeuralCard.jsx'

const stateStyle = {
  outdated: { chip: 'bg-cortex-rose/10 text-cortex-rose border-cortex-rose/30', label: 'outdated' },
  stable:   { chip: 'bg-cortex-cyan/10 text-cortex-cyan border-cortex-cyan/30', label: 'stable'   },
  current:  { chip: 'bg-cortex-green/10 text-cortex-green border-cortex-green/30', label: 'current' },
}

export default function EntityHistory({ activeIdx = timelinePoints.length - 1 }) {
  const [entityId, setEntityId] = useState(entityList[0].id)
  const activeT = timelinePoints[activeIdx]?.t
  const history = entityHistory[entityId] || []

  return (
    <div className="px-3.5 pb-3 flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300 mr-1">
          Entity
        </p>
        {entityList.map((e) => (
          <button
            key={e.id}
            onClick={() => setEntityId(e.id)}
            className={[
              'px-2 py-0.5 rounded-full text-[10px] font-mono border transition',
              entityId === e.id
                ? 'bg-cortex-purple/15 text-cortex-purple border-cortex-purple/40 shadow-glow-purple'
                : 'bg-void-700/50 text-ink-300 border-white/10 hover:text-ink-100',
            ].join(' ')}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto scrollbar-neural pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {history.map((h, i) => {
            const s = stateStyle[h.state]
            const isBeforeCursor = h.t <= activeT
            return (
              <motion.div
                key={`${entityId}-${h.t}-${i}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: isBeforeCursor ? 1 : 0.35, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <NeuralCard
                  accent={h.state === 'current' ? 'green' : h.state === 'outdated' ? 'neutral' : 'purple'}
                  className="p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-ink-300">{h.t}</p>
                      <p
                        className={[
                          'text-xs mt-0.5',
                          h.state === 'outdated' ? 'line-through text-ink-300' : 'text-ink-100',
                        ].join(' ')}
                      >
                        {h.fact}
                      </p>
                    </div>
                    <span
                      className={[
                        'shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border',
                        s.chip,
                      ].join(' ')}
                    >
                      {s.label}
                    </span>
                  </div>
                </NeuralCard>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
