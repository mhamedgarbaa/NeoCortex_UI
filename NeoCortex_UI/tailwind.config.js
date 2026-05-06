/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Dark neural surfaces ─────────────────────────────────────
        surface: {
          50:  '#020C18',
          100: '#040F22',
          200: '#071428',
          300: '#0A1A35',
          400: '#0F2347',
        },
        // ── Text (light on dark) ─────────────────────────────────────
        ink: {
          900: '#E8F4FF',
          700: '#C0D8F0',
          500: '#7AAED4',
          400: '#5590C0',
          300: '#2E6A9E',
          200: '#1A3D66',
          100: '#0D2240',
        },
        // ── Neural glow accents ──────────────────────────────────────
        cortex: {
          blue:   '#0EA5E9',
          purple: '#818CF8',
          green:  '#10B981',
          amber:  '#F59E0B',
          cyan:   '#22D3EE',
          rose:   '#FB7185',
          // Glow tints (dark translucent)
          'blue-tint':   'rgba(14,165,233,0.08)',
          'purple-tint': 'rgba(129,140,248,0.08)',
          'green-tint':  'rgba(16,185,129,0.08)',
          'amber-tint':  'rgba(245,158,11,0.08)',
          'cyan-tint':   'rgba(34,211,238,0.08)',
          'rose-tint':   'rgba(251,113,133,0.08)',
        },
        // ── Neural electric colors ───────────────────────────────────
        neural: {
          glow:   '#00AAFF',
          bright: '#38BDF8',
          deep:   '#0369A1',
          dark:   '#020C18',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':      '0 1px 12px rgba(0,170,255,0.06), 0 0 0 1px rgba(14,165,233,0.12)',
        'card-md':   '0 4px 24px rgba(0,170,255,0.10), 0 0 0 1px rgba(14,165,233,0.15)',
        'card-lg':   '0 8px 40px rgba(0,170,255,0.14), 0 0 0 1px rgba(14,165,233,0.2)',
        'nav':       '0 1px 0 rgba(14,165,233,0.12)',
        'glow-blue':   '0 0 16px rgba(14,165,233,0.35), 0 0 0 1px rgba(14,165,233,0.3)',
        'glow-purple': '0 0 16px rgba(129,140,248,0.35), 0 0 0 1px rgba(129,140,248,0.3)',
        'glow-green':  '0 0 16px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.3)',
        'glow-amber':  '0 0 16px rgba(245,158,11,0.35), 0 0 0 1px rgba(245,158,11,0.3)',
        'glow-cyan':   '0 0 20px rgba(34,211,238,0.4),  0 0 0 1px rgba(34,211,238,0.3)',
        'ring-blue':   '0 0 0 2px #0EA5E9',
        'neural':      '0 0 30px rgba(0,170,255,0.2), inset 0 0 30px rgba(0,170,255,0.03)',
      },
      backgroundImage: {
        'page-gradient':
          'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 40%, #ECFDF5 100%)',
        'hero-mesh':
          'radial-gradient(at 20% 0%,  rgba(37,99,235,0.08) 0px, transparent 50%),' +
          'radial-gradient(at 80% 0%,  rgba(124,58,237,0.06) 0px, transparent 50%),' +
          'radial-gradient(at 50% 100%,rgba(5,150,105,0.06)  0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.25s ease-out both',
        'slide-up':   'slideUp 0.3s ease-out both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },            to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' },
                   to:   { opacity: 1, transform: 'translateY(0)' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
