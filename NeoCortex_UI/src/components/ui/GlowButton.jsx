import { motion } from 'framer-motion'

const tones = {
  blue:   'bg-cortex-blue/15   text-cortex-blue   border-cortex-blue/40   hover:shadow-glow-blue',
  purple: 'bg-cortex-purple/15 text-cortex-purple border-cortex-purple/40 hover:shadow-glow-purple',
  green:  'bg-cortex-green/15  text-cortex-green  border-cortex-green/40  hover:shadow-glow-green',
  amber:  'bg-cortex-amber/15  text-cortex-amber  border-cortex-amber/40  hover:shadow-glow-amber',
  cyan:   'bg-cortex-cyan/15   text-cortex-cyan   border-cortex-cyan/40   hover:shadow-glow-cyan',
  ghost:  'bg-white/5          text-ink-200       border-white/10        hover:bg-white/10',
}

export default function GlowButton({
  tone = 'cyan',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const sizing = size === 'sm'
    ? 'px-2.5 py-1 text-xs rounded-md'
    : size === 'lg'
    ? 'px-5 py-2.5 text-sm rounded-lg'
    : 'px-3.5 py-1.5 text-xs rounded-md'
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={[
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider',
        'border transition-all duration-200 select-none',
        tones[tone], sizing, className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
