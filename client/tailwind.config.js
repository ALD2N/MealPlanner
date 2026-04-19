/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(1rem)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
    },
  },
  plugins: [],
}
