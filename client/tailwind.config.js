/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reddit-exact color palette (dark mode)
        reddit: {
          bg: '#dae0e6',          // Reddit light bg
          'dark-bg': '#1a1a1b',   // Reddit dark bg
          'dark-surface': '#272729', // Reddit dark card bg
          'dark-elevated': '#1a1a1b',
          'dark-border': '#343536',
          'dark-muted': '#818384',
          orange: '#ff4500',       // Reddit orange
          'orange-hover': '#e03d00',
          blue: '#0079d3',         // Reddit blue
          'blue-hover': '#006cbf',
          upvote: '#ff4500',
          downvote: '#7193ff',
          text: '#d7dadc',
          'text-dim': '#818384',
          gold: '#ffd635',
          silver: '#c6c9ce',
          green: '#46d160',
        }
      },
      fontFamily: {
        ibm: ['"IBM Plex Sans"', 'sans-serif'],
        noto: ['"Noto Sans"', 'sans-serif'],
      },
      animation: {
        'vote-pop': 'vote-pop 0.15s ease-out',
      },
      keyframes: {
        'vote-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
