/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'night-blue': {
          900: '#0f172a',
          800: '#1e293b',
        },
        'prayer-card': {
          900: '#1e1b4b',
          800: '#312e81',
        },
        'ios': {
          'dark': '#000000',
          'dark-elevated': '#171717',
          'dark-secondary': '#1C1C1E',
          'dark-tertiary': '#2C2C2E',
          'separator': '#38383A',
          'accent': '#8E8E93',
          'accent-tap': '#636366',
          'green': '#30D158',
          'orange': '#FF9F0A',
          'red': '#FF453A',
          'purple': '#BF5AF2',
          'gray': '#8E8E93',
          'label': '#F5F6F7',
          'label-secondary': '#D5DADD',
          'label-tertiary': '#A9B4BE',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'card': '0 0 20px rgba(199, 199, 255, 0.1)',
        'glow': '0 0 30px rgba(149, 149, 255, 0.2)',
        'ios': '0 2px 10px rgba(0, 0, 0, 0.3)',
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
      },
      spacing: {
        '0.25': '0.0625rem',
        '0.5': '0.125rem',
      }
    },
  },
  plugins: [],
} 