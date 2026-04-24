import { motion } from 'framer-motion'
import TopBar from './TopBar.jsx'
import BrainCore from './BrainCore.jsx'
import FloatingAgentPanel from './FloatingAgentPanel.jsx'
import OntologyPanel from '../ontology/OntologyPanel.jsx'
import MemoryPanel from '../memory/MemoryPanel.jsx'
import AdapterPanel from '../adapter/AdapterPanel.jsx'

export default function AppShell() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* backdrop grid */}
      <div className="absolute inset-0 neural-grid opacity-40 pointer-events-none" />

      {/* central living brain */}
      <BrainCore />

      {/* top bar */}
      <TopBar />

      {/* 3 cortex columns */}
      <main className="relative z-10 h-[calc(100vh-3.5rem)] p-3 gap-3
                       grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[360px_minmax(0,1fr)_400px]">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="min-h-0 h-full"
        >
          <OntologyPanel />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
          className="min-h-0 h-full"
        >
          <MemoryPanel />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          className="min-h-0 h-full"
        >
          <AdapterPanel />
        </motion.section>
      </main>

      {/* floating agent */}
      <FloatingAgentPanel />
    </div>
  )
}
