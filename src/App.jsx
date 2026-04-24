import { AnimatePresence, motion } from 'framer-motion'
import NavBar from './components/nav/NavBar.jsx'
import OntologyPage from './pages/OntologyPage.jsx'
import ReviewPage   from './pages/ReviewPage.jsx'
import GraphPage    from './pages/GraphPage.jsx'
import MemoryPage   from './pages/MemoryPage.jsx'
import AgentPage    from './pages/AgentPage.jsx'
import { useNeocortex } from './store/useNeocortex.js'

const PAGE_MAP = {
  ontology: OntologyPage,
  review:   ReviewPage,
  graph:    GraphPage,
  memory:   MemoryPage,
  agent:    AgentPage,
}

// Pages that manage their own height (no outer scroll wrapper)
const FULL_HEIGHT_PAGES = new Set(['review', 'graph', 'agent'])

export default function App() {
  const page = useNeocortex((s) => s.page)
  const Page = PAGE_MAP[page] ?? OntologyPage
  const isFull = FULL_HEIGHT_PAGES.has(page)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={isFull ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1 overflow-auto scrollbar-thin'}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
