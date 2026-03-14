/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#09090b',
          surface: '#111115',
          gold: '#c9a84c',
          'gold-dim': 'rgba(201,168,76,0.12)',
          text: '#f0ede8',
          muted: '#a09d97',
          success: '#4caf7d',
          danger: '#e05252'
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace']
      }
    },
  },
  plugins: [],
}
