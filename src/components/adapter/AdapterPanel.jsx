import SectionHeader from '../ui/SectionHeader.jsx'
import QueryInput from './QueryInput.jsx'
import QueryInterpretation from './QueryInterpretation.jsx'
import ContextBudgetSlider from './ContextBudgetSlider.jsx'
import TokenEfficiencyMeter from './TokenEfficiencyMeter.jsx'
import ContextBlocks from './ContextBlocks.jsx'
import ParticleFlow from '../ui/ParticleFlow.jsx'
import { useNeocortex } from '../../store/useNeocortex.js'

export default function AdapterPanel() {
  const stage = useNeocortex((s) => s.pipelineStage)

  return (
    <div className="panel h-full flex flex-col">
      <SectionHeader
        tone="cyan"
        title="Cognitive Filter"
        subtitle="Context adapter · compiler"
        right={
          <span className="chip text-cortex-cyan border-cortex-cyan/40">
            {stage === 'idle' ? 'ready' : stage}
          </span>
        }
      />

      <div className="flex flex-col min-h-0 flex-1">
        <QueryInput />
        <QueryInterpretation />
        <ParticleFlow tone="cyan" count={4} speed={2.6} />
        <ContextBudgetSlider />
        <TokenEfficiencyMeter />
        <div className="hr-neural my-1" />
        <ContextBlocks />
      </div>
    </div>
  )
}
