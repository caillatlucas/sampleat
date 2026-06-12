/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'retro-bg': '#e4e1d9',
        'retro-panel': '#d9d6ce',
        'retro-border-light': '#ffffff',
        'retro-border-dark': '#a3a098',
        'retro-text': '#333333',
        'brand-red': '#d73b3b',
        'mpc-green': '#7f988f',
        'mpc-pad': '#648074',
        'mpc-pad-active': '#81a393',
        'mpc-lcd-bg': '#0c2509',
        'mpc-lcd-text': '#52ff3b',
        'mpc-blue': '#FF3131',
        'mpc-top': '#1e2129'
      },
      fontFamily: {
        sans: ['Tahoma', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'retro-outset': 'inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #a3a098',
        'retro-inset': 'inset 2px 2px 0px 0px #a3a098, inset -2px -2px 0px 0px #ffffff',
        'mpc-pad-outset': 'inset 2px 2px 0px 0px #7b9c8d, inset -2px -2px 0px 0px #4d665a',
        'mpc-pad-inset': 'inset 2px 2px 0px 0px #4d665a, inset -2px -2px 0px 0px #7b9c8d',
      }
    },
  },
  plugins: [],
}
