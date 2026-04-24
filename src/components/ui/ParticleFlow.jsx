import { motion } from 'framer-motion'

/**
 * ParticleFlow — a slim horizontal/vertical lane with animated particles,
 * representing data flowing through the system. Purely decorative.
 */
export default function ParticleFlow({
  direction = 'horizontal',
  count     = 6,
  tone      = 'cyan',
  speed     = 3,
  className = '',
}) {
  const color = {
    blue: '#3B82F6',
    purple: '#A855F7',
    green: '#10D9A0',
    amber: '#F59E0B',
    cyan: '#22D3EE',
  }[tone] || '#22D3EE'

  const isH = direction === 'horizontal'
  return (
    <div
      className={[
        'relative overflow-hidden pointer-events-none',
        isH ? 'h-[2px] w-full' : 'w-[2px] h-full',
        className,
      ].join(' ')}
    >
      <div
        className={isH ? 'absolute inset-0 h-full w-full' : 'absolute inset-0 h-full w-full'}
        style={{
          background: `linear-gradient(${isH ? '90deg' : '180deg'}, transparent, ${color}33, transparent)`,
        }}
      />
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4, height: 4,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            top:  isH ? '-1px' : undefined,
            left: isH ? undefined : '-1px',
          }}
          initial={{ [isH ? 'x' : 'y']: '-10%', opacity: 0 }}
          animate={{
            [isH ? 'x' : 'y']: ['-10%', '110%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: speed + (i * 0.35),
            repeat: Infinity,
            delay:  i * (speed / count),
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
