/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['var(--font-poppins)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          green: '#10B981',
          'green-dark': '#059669',
        },
      },
      animation: {
        'shimmer': 'shimmer 5s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': {
            'background-position': '-200% 0',
          },
          '50%': {
            'background-position': '200% 0',
          },
        },
      },
    },
  },
  plugins: [],
}
