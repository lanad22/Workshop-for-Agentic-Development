/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // PRD §6.6 color system — mapped to theme tokens so components never
      // hardcode hex values. Filled square is light-blue (#dbeafe) + dark text
      // per implementation-plan §2 #8 (NOT solid blue-500 + white).
      colors: {
        bg: {
          primary: '#ffffff',
          secondary: '#f3f4f6',
        },
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
        },
        square: {
          default: '#ffffff',
          filled: '#dbeafe',        // light blue fill
          'filled-text': '#1f2937', // dark text on filled square (WCAG AA)
          hover: '#eff6ff',
          free: '#fef3c7',          // warm yellow free space
          win: '#86efac',           // bright green winning line
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
