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
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
        },
        blindspot: {
          red: '#ef4444',
          amber: '#f59e0b',
          emerald: '#10b981',
          indigo: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Tamil', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
