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
          bg: 'var(--ig-bg)',
          surface: 'var(--ig-surface)',
          elevated: 'var(--ig-elevated)',
          highlight: 'var(--ig-highlight)',
          hover: 'var(--ig-hover)',
          border: 'var(--ig-border)',
          'border-subtle': 'var(--ig-border-subtle)',
          'border-hover': 'var(--ig-border-hover)',
          primary: 'var(--ig-text-primary)',
          secondary: 'var(--ig-text-secondary)',
          tertiary: 'var(--ig-text-tertiary)',
          link: 'var(--ig-text-link)',
          blue: 'var(--ig-primary-button)',
          'blue-hover': 'var(--ig-primary-button-hover)',
          like: 'var(--ig-like)',
        },
        hub: {
          background: 'var(--ig-bg)',
          surface: 'var(--ig-surface)',
          'surface-elevated': 'var(--ig-elevated)',
          border: 'var(--ig-border)',
          'border-subtle': 'var(--ig-border-subtle)',
          'text-primary': 'var(--ig-text-primary)',
          'text-secondary': 'var(--ig-text-secondary)',
          'text-tertiary': 'var(--ig-text-tertiary)',
          accent: 'var(--ig-primary-button)',
          'accent-hover': 'var(--ig-primary-button-hover)',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        logo: ['"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
