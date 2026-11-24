/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0B0E',
        charcoal: '#16161C',
        wine: {
          DEFAULT: '#9E1B32',
          deep: '#8B1E3F',
          hover: '#B8254E',
          bright: '#C83254',
          light: '#E86B86',
          dark: '#4A0E1E',
        },
        cream: '#F5F0E6',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        wine: '0 0 30px rgba(158, 27, 50, 0.28)',
        'wine-lg': '0 10px 42px rgba(184, 37, 78, 0.32)',
      },
    },
  },
  plugins: [],
};
