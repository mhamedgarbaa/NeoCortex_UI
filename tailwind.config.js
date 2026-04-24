/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Light-mode surfaces ──────────────────────────────────────
        surface: {
          50:  '#FFFFFF',
          100: '#F8FAFF',
          200: '#EEF2FF',
          300: '#E0E7FF',
        },
        // ── Text ────────────────────────────────────────────────────
        ink: {
          900: '#0F172A',
          700: '#1E293B',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
          200: '#CBD5E1',
          100: '#E2E8F0',
        },
        // ── Brand accents ───────────────────────────────────────────
        cortex: {
          blue:   '#2563EB',
          purple: '#7C3AED',
          green:  '#059669',
          amber:  '#D97706',
          cyan:   '#0891B2',
          rose:   '#E11D48',
          // Soft tints (for backgrounds)
          'blue-tint':   '#EFF6FF',
          'purple-tint': '#F5F3FF',
          'green-tint':  '#ECFDF5',
          'amber-tint':  '#FFFBEB',
          'cyan-tint':   '#ECFEFF',
          'rose-tint':   '#FFF1F2',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md':   '0 4px 16px -2px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'card-lg':   '0 8px 32px -4px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        'nav':       '0 1px 0 rgba(0,0,0,0.06)',
        'glow-blue':   '0 0 0 3px rgba(37,99,235,0.15)',
        'glow-purple': '0 0 0 3px rgba(124,58,237,0.15)',
        'glow-green':  '0 0 0 3px rgba(5,150,105,0.15)',
        'glow-amber':  '0 0 0 3px rgba(217,119,6,0.15)',
        'ring-blue':   '0 0 0 2px #2563EB',
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
