/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ig: {
          bg: '#000000',
          elevated: '#121212',
          surface: '#262626',
          hover: '#1a1a1a',
          border: '#262626',
          'light-bg': '#ffffff',
          'light-elevated': '#fafafa',
          'light-surface': '#efefef',
          'light-border': '#dbdbdb',
          'text-primary': '#f5f5f5',
          'text-secondary': '#a8a8a8',
          'text-muted': '#737373',
          'light-text-primary': '#000000',
          'light-text-secondary': '#737373',
          blue: '#0095f6',
          'blue-hover': '#1877f2',
          red: '#ed4956',
          'heart-red': '#ff3040',
          story: '#e1306c',
        },
        brand: {
          verified: '#0095f6',
          gold: '#ffd635',
          success: '#00ba7c',
          danger: '#ed4956',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        brand: ['"Outfit"', '"Grand Hotel"', 'cursive', 'sans-serif'],
      },
      animation: {
        'like-heart': 'likeHeart 0.8s ease-in-out forwards',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'story-pulse': 'storyPulse 2s infinite',
      },
      keyframes: {
        likeHeart: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        storyPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        }
      }
    },
  },
  plugins: [],
}
