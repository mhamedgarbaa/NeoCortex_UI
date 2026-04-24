import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNeocortex } from '../../store/useNeocortex.js'
import { querySuggestions } from '../../data/mockQueries.js'
import GlowButton from '../ui/GlowButton.jsx'

export default function QueryInput() {
  const query = useNeocortex((s) => s.query)
  const setQuery = useNeocortex((s) => s.setQuery)
  const run = useNeocortex((s) => s.runQuery)
  const stage = useNeocortex((s) => s.pipelineStage)
  const running = stage !== 'idle' && stage !== 'done'

  const [focus, setFocus] = useState(false)

  function submit() {
    if (!query.trim() || running) return
    run(query)
  }

  const filtered = query
    ? querySuggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase()) && s.toLowerCase() !== query.toLowerCase()
      )
    : querySuggestions

  return (
    <div className="px-3.5 pt-3 pb-2">
      <div
        className={[
          'relative rounded-xl border transition-all duration-200 bg-void-700/60',
          focus
            ? 'border-cortex-cyan/60 shadow-glow-cyan'
            : 'border-white/10 hover:border-white/20',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-cortex-cyan font-mono text-xs">▸</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask the cortex…"
            className="flex-1 bg-transparent outline-none text-sm text-ink-100
                       placeholder:text-ink-400 font-mono"
          />
          <GlowButton tone="cyan" size="sm" onClick={submit} disabled={running}>
            {running ? 'Thinking…' : 'Invoke'}
          </GlowButton>
        </div>

        <AnimatePresence>
          {focus && filtered.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-20 top-full mt-1 left-0 right-0 rounded-lg border border-white/10
                         bg-void-800/95 backdrop-blur-xl shadow-panel overflow-hidden"
            >
              {filtered.slice(0, 4).map((s) => (
                <li key={s}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setQuery(s) }}
                    className="w-full text-left px-3 py-2 text-[12px] text-ink-200
                               hover:bg-cortex-cyan/10 hover:text-cortex-cyan transition"
                  >
                    <span className="text-ink-400 font-mono mr-2">↳</span>{s}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
