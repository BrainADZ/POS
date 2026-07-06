/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        ivory: '#F7F6F2',
        sand: '#E8E3DA',
        // sage green — primary brand
        brand: {
          50: '#F1F4F1',
          100: '#E2E9E2',
          200: '#C8D4C8',
          300: '#A9BCA9',
          400: '#8CA38C',
          500: '#799079',
          600: '#6B7F6B',
          700: '#566855',
          800: '#455345',
          900: '#333F33',
        },
        // copper — accent
        accent: {
          50: '#F9F0EA',
          100: '#F2DfD2',
          200: '#E4BFA6',
          300: '#D39D7B',
          400: '#C58660',
          500: '#B8734E',
          600: '#A35F3C',
          700: '#854C30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};
