import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Desert warm palette
        sand: {
          light: '#D4A76A',
          DEFAULT: '#C49555',
        },
        sky: {
          light: '#C4D4E0',
          DEFAULT: '#87AECC',
        },
        cream: {
          DEFAULT: '#FAF5EE',
          dark: '#F5F0E8',
        },
        brown: {
          border: '#8B7355',
          text: '#3D2B1F',
          tag: '#6B5744',
        },
        accent: {
          gold: '#B8860B',
          DEFAULT: '#C49555',
        },
        tag: {
          bg: '#E8DCC8',
          text: '#6B5744',
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      transitionTimingFunction: {
        decel: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'sun-rays': 'sunrays 20s ease-in-out infinite',
        'sand-drift': 'sanddrift 30s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        sunrays: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(0)' },
          '50%': { opacity: '0.5', transform: 'translateX(10px)' },
        },
        sanddrift: {
          '0%': { transform: 'translateX(-100%) translateY(0)' },
          '100%': { transform: 'translateX(100vw) translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
