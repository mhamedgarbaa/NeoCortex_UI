import { useState } from 'react'
import { motion } from 'framer-motion'
import { timelinePoints } from '../../data/mockMemory.js'

export default function TimelineSlider({ value, onChange }) {
  const [v, setV] = useState(value ?? timelinePoints.length - 1)
  const active = timelinePoints[v]

  function set(i) {
    setV(i)
    onChange?.(timelinePoints[i], i)
  }

  return (
    <div className="px-3.5 py-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-300">
          Temporal scrubber
        </p>
        <span className="text-[11px] font-mono text-cortex-purple">
          {active.t} · {active.label}
        </span>
      </div>

      <div className="relative h-10">
        {/* track */}
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-[2px]
                        bg-gradient-to-r from-cortex-purple/50 via-white/10 to-cortex-purple/50" />

        {/* points */}
        <div className="absolute inset-x-0 top-0 h-full flex items-center justify-between">
          {timelinePoints.map((p, i) => {
            const isActive = i === v
            const isPast   = i <= v
            return (
              <button
                key={p.t}
                onClick={() => set(i)}
                className="relative group flex flex-col items-center"
              >
                <motion.span
                  animate={{ scale: isActive ? 1.25 : 1 }}
                  className={[
                    'block rounded-full border',
                    isActive
                      ? 'w-3 h-3 bg-cortex-purple border-cortex-purple shadow-glow-purple'
                      : isPast
                      ? 'w-2 h-2 bg-cortex-purple/70 border-cortex-purple/70'
                      : 'w-2 h-2 bg-void-600 border-white/15',
                  ].join(' ')}
                />
                <span
                  className={[
                    'mt-1.5 font-mono text-[9px] tracking-wider',
                    isActive ? 'text-cortex-purple' : 'text-ink-400 group-hover:text-ink-200',
                  ].join(' ')}
                >
                  {p.t}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
