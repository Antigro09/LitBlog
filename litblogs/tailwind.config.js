/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: null,
            'h1, h2, h3, h4, h5, h6, p, span, div': {
              color: 'inherit'
            },
            'code, pre': {
              color: 'inherit'
            },
            a: {
              color: 'inherit'
            }
          }
        }
      }
    }
  },
  safelist: [

  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

