/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          background: '#082724',
          sidebar: '#0b2f2d',
          surface: '#0c2624',
          surfaceSoft: '#0f312f',
          accent: '#34d399',
          accentSoft: '#1f403b',
          text: '#f8fafc',
          muted: '#cbd5d1',
          highlight: '#7af4b4',
        },
      },
    },
  },
  plugins: [],
}
