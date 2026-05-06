import { AnimatePresence, motion } from 'framer-motion'
import NavBar from './components/nav/NavBar.jsx'
import NeuralBackground from './components/ui/NeuralBackground.jsx'
import AgentPage from './pages/AgentPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import GraphPage from './pages/GraphPage.jsx'
import MemoryPage from './pages/MemoryPage.jsx'
import OntologyPage from './pages/OntologyPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import TestingPage from './pages/TestingPage.jsx'
import VisualizationPage from './pages/VisualizationPage.jsx'
import { useNeocortex } from './store/useNeocortex.js'

const PAGE_MAP = {
  dashboard: DashboardPage,
  ontology:  OntologyPage,
  review:    ReviewPage,
  graph:     GraphPage,
  memory:    MemoryPage,
  agent:     AgentPage,
  testing:   TestingPage,
  visualization: VisualizationPage,
}

// Pages that manage their own height (no outer scroll wrapper)
const FULL_HEIGHT_PAGES = new Set(['review', 'graph', 'agent', 'visualization'])

export default function App() {
  const page = useNeocortex((s) => s.page)
  const Page = PAGE_MAP[page] ?? OntologyPage
  const isFull = FULL_HEIGHT_PAGES.has(page)

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <NeuralBackground />
      <div className="absolute inset-0 neural-grid opacity-20 pointer-events-none z-0" />
      <NavBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={[isFull ? 'flex-1 min-h-0 overflow-hidden ' : 'flex-1 overflow-auto scrollbar-thin ', 'relative z-10 w-full'].join('')}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
