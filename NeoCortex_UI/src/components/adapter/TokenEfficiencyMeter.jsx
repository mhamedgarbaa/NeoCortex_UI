import { motion } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'

export default function TokenEfficiencyMeter() {
  const last = useNeocortex((s) => s.lastResult)
  const raw = last?.tokensRaw ?? 12480
  const filt = last?.tokensFiltered ?? 2040
  const ratio = Math.max(0.05, filt / raw)
  const reduction = ((1 - ratio) * 100).toFixed(0)

  return (
    <div className="px-3.5 py-2">
      <div className="rounded-lg border border-white/10 bg-void-700/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink-300">
            Token efficiency
          </p>
          <span className="text-[10px] font-mono text-cortex-green">
            −{reduction}%
          </span>
        </div>

        {/* Dual bar: raw background, filtered overlay */}
        <div className="relative h-3 rounded-full overflow-hidden bg-void-600">
          {/* raw bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cortex-rose/40 via-cortex-amber/40 to-cortex-rose/40"
          />
          {/* filtered overlay */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.9, delay: 0.2, type: 'spring', stiffness: 70 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cortex-green via-cortex-cyan to-cortex-green shadow-[0_0_12px_rgba(16,217,160,0.7)]"
          />
          {/* ruler ticks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="w-px h-full bg-void-900/60" />
            ))}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] font-mono text-ink-300 uppercase tracking-wider">Raw</p>
            <p className="text-[13px] font-mono text-cortex-rose">{raw.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-ink-300 uppercase tracking-wider">Filtered</p>
            <p className="text-[13px] font-mono text-cortex-green">{filt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-ink-300 uppercase tracking-wider">Ratio</p>
            <p className="text-[13px] font-mono text-cortex-cyan">{(ratio * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
