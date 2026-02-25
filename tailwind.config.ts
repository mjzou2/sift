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
          text: '#5A4835',
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
        'float-1': 'float1 28s ease-in-out infinite',
        'float-2': 'float2 34s ease-in-out infinite',
        'float-3': 'float3 24s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'eq-1': 'eqBar 0.45s ease-in-out infinite alternate',
        'eq-2': 'eqBar 0.55s ease-in-out infinite alternate-reverse',
        'eq-3': 'eqBar 0.35s ease-in-out infinite alternate',
      },
      keyframes: {
        sunrays: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(0)' },
          '50%': { opacity: '0.5', transform: 'translateX(10px)' },
        },
        float1: {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '15%':  { transform: 'translate(12vw, -4vh) scale(1.6)' },
          '30%':  { transform: 'translate(5vw, 6vh) scale(0.7)' },
          '45%':  { transform: 'translate(18vw, 2vh) scale(1.4)' },
          '60%':  { transform: 'translate(8vw, -5vh) scale(0.8)' },
          '75%':  { transform: 'translate(20vw, 3vh) scale(1.5)' },
          '90%':  { transform: 'translate(10vw, -2vh) scale(0.9)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        float2: {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '12%':  { transform: 'translate(-8vw, 5vh) scale(0.6)' },
          '28%':  { transform: 'translate(6vw, -3vh) scale(1.5)' },
          '40%':  { transform: 'translate(-12vw, -6vh) scale(0.8)' },
          '55%':  { transform: 'translate(3vw, 4vh) scale(1.3)' },
          '68%':  { transform: 'translate(-6vw, -2vh) scale(0.7)' },
          '82%':  { transform: 'translate(10vw, 5vh) scale(1.4)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        float3: {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '18%':  { transform: 'translate(15vw, 3vh) scale(1.5)' },
          '35%':  { transform: 'translate(-4vw, -7vh) scale(0.6)' },
          '50%':  { transform: 'translate(10vw, 5vh) scale(1.3)' },
          '65%':  { transform: 'translate(-8vw, -3vh) scale(0.8)' },
          '80%':  { transform: 'translate(5vw, 6vh) scale(1.6)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        eqBar: {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
