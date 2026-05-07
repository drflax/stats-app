/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'handball-bg': '#0a0d12',
        'handball-bg2': '#111620',
        'handball-bg3': '#1a2030',
        'handball-accent': '#4f8ef7',
        'handball-green': '#34c97a',
        'handball-red': '#f05252',
        'handball-amber': '#f59e0b',
        'handball-purple': '#a78bfa',
        'handball-teal': '#2dd4bf',
        'handball-border': 'rgba(255,255,255,0.08)',
        'handball-border2': 'rgba(255,255,255,0.14)',
        'handball-text': '#e8edf5',
        'handball-text2': '#8b95a8',
        'handball-text3': '#5a6478',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}