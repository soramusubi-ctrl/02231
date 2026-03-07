/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#4ade80',
        'brand-dark': '#14532d',
        'brand-light': '#dcfce7',
        'pastel-orange': '#fdba74',
        'pastel-orange-light': '#ffedd5',
        'pastel-green': '#86efac',
        'pastel-green-light': '#dcfce7',
        'pastel-blue': '#93c5fd',
        'pastel-pink': '#f9a8d4',
        'pastel-yellow': '#fde047',
      },
      fontFamily: {
        sans: [
          'Zen Maru Gothic',
          'Helvetica Neue',
          'Arial',
          'Hiragino Kaku Gothic ProN',
          'Hiragino Sans',
          'Meiryo',
          'sans-serif',
        ],
      },
      screens: {
        'xs': '390px',
      },
    },
  },
  plugins: [],
};
