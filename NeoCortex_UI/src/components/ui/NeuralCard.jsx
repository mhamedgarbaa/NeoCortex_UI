import { motion } from 'framer-motion'

const accentMap = {
  blue:   'from-cortex-blue/40   via-cortex-blue/5   shadow-glow-blue   border-cortex-blue/20',
  purple: 'from-cortex-purple/40 via-cortex-purple/5 shadow-glow-purple border-cortex-purple/20',
  green:  'from-cortex-green/40  via-cortex-green/5  shadow-glow-green  border-cortex-green/20',
  amber:  'from-cortex-amber/40  via-cortex-amber/5  shadow-glow-amber  border-cortex-amber/20',
  cyan:   'from-cortex-cyan/40   via-cortex-cyan/5   shadow-glow-cyan   border-cortex-cyan/20',
  neutral:'from-white/10        via-white/0         shadow-panel       border-white/10',
}

export default function NeuralCard({
  accent = 'neutral',
  className = '',
  children,
  hover = false,
  ...rest
}) {
  const tone = accentMap[accent] || accentMap.neutral
  return (
    <motion.div
      layout
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={[
        'relative rounded-xl border bg-void-700/50 backdrop-blur-md',
        'bg-gradient-to-br to-transparent',
        tone,
        className,
      ].join(' ')}
      {...rest}
    >
      {/* top-edge highlight */}
      <div className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.div>
  )
}
