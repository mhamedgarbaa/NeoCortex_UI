import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PulseDot from '../ui/PulseDot.jsx'

export default function FileUploader({ onFiles }) {
  const [over, setOver] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef(null)

  function handleFiles(list) {
    const arr = Array.from(list).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || 'data',
    }))
    setFiles((prev) => [...prev, ...arr])
    onFiles?.(arr)
  }

  return (
    <div className="px-3.5 pt-3 space-y-2">
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={[
          'relative block cursor-pointer rounded-xl border border-dashed',
          'transition-all duration-200 px-4 py-5 text-center',
          over
            ? 'border-cortex-blue/70 bg-cortex-blue/10 shadow-glow-blue'
            : 'border-white/10 bg-void-700/40 hover:border-cortex-blue/40 hover:bg-cortex-blue/5',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex items-center justify-center gap-2 mb-1">
          <PulseDot tone="blue" size={7} animate={over} />
          <span className="text-[11px] font-mono uppercase tracking-wider text-cortex-blue">
            Ingest Source
          </span>
        </div>
        <p className="text-xs text-ink-200">
          Drop files or <span className="text-cortex-blue underline underline-offset-2">browse</span>
        </p>
        <p className="text-[10px] font-mono text-ink-300 mt-1">
          CSV · JSON · PDF · DOCX · SQL · REST
        </p>
      </label>

      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 overflow-hidden"
          >
            {files.slice(-3).map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between text-[11px] font-mono
                           px-2.5 py-1.5 rounded-md bg-void-700/60 border border-white/5"
              >
                <span className="truncate text-ink-100">{f.name}</span>
                <span className="text-ink-300 ml-2 shrink-0">{(f.size / 1024).toFixed(1)} kb</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
