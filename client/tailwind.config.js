/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fef1f5',
          100: '#fee5ed',
          200: '#fdcede',
          300: '#fca5c3',
          400: '#f97da4',
          500: '#f15080',
        },
        lavender: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0ff',
          300: '#c4a8ff',
          400: '#a87dff',
          500: '#8b5cf6',
        },
        mint: {
          50: '#edfcf5',
          100: '#d3f9e8',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        baby: {
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.3)',
          shadow: 'rgba(0, 0, 0, 0.05)',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'glass': '20px',
        '4xl': '2rem',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
        'glow': '0 0 20px 0 rgba(139, 92, 246, 0.15)',
        'glow-pink': '0 0 20px 0 rgba(241, 80, 128, 0.15)',
      }
    },
  },
  plugins: [],
};
