/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema NANLOMO - Inspirado en la carta del restaurante
        nanlomo: {
          black: '#1a1a1a',
          gold: '#FFD700',
          'gold-light': '#FFC107',
          red: '#DC2626',
          'red-dark': '#991B1B',
          white: '#FFFFFF',
          gray: '#9CA3AF',
        },
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFD700', // gold principal
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DC2626', // rojo principal
          600: '#991B1B',
          700: '#7f1d1d',
          800: '#991B1B',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        'nanlomo': ['Impact', 'Arial Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
