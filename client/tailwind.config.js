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
        hub: {
          background: 'var(--background)',
          surface: 'var(--surface)',
          'surface-elevated': 'var(--surface-elevated)',
          'surface-muted': 'var(--surface-muted)',
          
          border: 'var(--border)',
          'border-subtle': 'var(--border-subtle)',
          
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          
          cyan: 'var(--cyan)',
          violet: 'var(--violet)',
          
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
          
          'focus-ring': 'var(--focus-ring)',

          // Aliases for semantic mapping
          bg: 'var(--background)',
          card: 'var(--surface)',
          'card-hover': 'var(--surface-elevated)',
          'text-muted': 'var(--text-tertiary)',
          trust: 'var(--accent)',
          'trust-soft': 'rgba(240, 110, 92, 0.15)',
          community: 'var(--violet)',
          'community-soft': 'rgba(139, 124, 246, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
