/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0B0E',
        charcoal: '#16161C',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8CC6C',
          dark: '#A68621',
        },
        cream: '#F5F0E6',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 30px rgba(212, 175, 55, 0.16)',
        'gold-lg': '0 10px 40px rgba(212, 175, 55, 0.22)',
      },
    },
  },
  plugins: [],
};
