/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        'theme-bg':           'var(--color-bg)',
        'theme-elevated':     'var(--color-bg-elevated)',
        'theme-hover':        'var(--color-bg-hover)',
        'theme-surface':      'var(--color-surface)',
        'theme-border':       'var(--color-border)',
        'theme-text':         'var(--color-text)',
        'theme-muted':        'var(--color-text-muted)',
        'theme-subtle':       'var(--color-text-subtle)',
        'theme-accent':       'var(--color-accent)',
        'theme-accent-hover': 'var(--color-accent-hover)',
        'theme-accent-text':  'var(--color-accent-text)',
        'theme-accent-pale':  'var(--color-accent-pale)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(1rem)' },
          'to':   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
