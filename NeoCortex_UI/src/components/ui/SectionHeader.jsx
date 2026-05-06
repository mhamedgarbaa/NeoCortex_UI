import PulseDot from './PulseDot.jsx'

export default function SectionHeader({ icon, title, subtitle, tone = 'cyan', right }) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <PulseDot tone={tone} size={9} />
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-200 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-ink-300 font-mono truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  )
}
