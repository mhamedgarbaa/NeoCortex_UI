const toneMap = {
  blue:   'bg-cortex-blue   shadow-[0_0_10px_rgba(59,130,246,0.9)]',
  purple: 'bg-cortex-purple shadow-[0_0_10px_rgba(168,85,247,0.9)]',
  green:  'bg-cortex-green  shadow-[0_0_10px_rgba(16,217,160,0.9)]',
  amber:  'bg-cortex-amber  shadow-[0_0_10px_rgba(245,158,11,0.9)]',
  cyan:   'bg-cortex-cyan   shadow-[0_0_10px_rgba(34,211,238,0.9)]',
  rose:   'bg-cortex-rose   shadow-[0_0_10px_rgba(251,113,133,0.9)]',
  gray:   'bg-ink-400',
}

export default function PulseDot({ tone = 'cyan', size = 8, animate = true, className = '' }) {
  const t = toneMap[tone] || toneMap.cyan
  return (
    <span
      className={['relative inline-flex', className].join(' ')}
      style={{ width: size, height: size }}
    >
      {animate && (
        <span className={['absolute inset-0 rounded-full opacity-75 animate-ping', t].join(' ')} />
      )}
      <span className={['relative inline-flex rounded-full w-full h-full', t].join(' ')} />
    </span>
  )
}
