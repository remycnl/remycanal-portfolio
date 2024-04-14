/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./assets/**/*.{js,ts}",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#111319',
          dark: '#020617',
        },
        white: '#ffffff',
        primary: '#0f172a',
        secondary: {
          purple: '#8D6DFA',
          pink: '#E178FB',
        },
        gray: {
          light: '#8c99b0',
          semi: '#334054',
          dark: '#1f293b',
        },
      },
      boxShadow: {
        'around': '0 0 30px rgba(0, 0, 0, 0.5)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}

