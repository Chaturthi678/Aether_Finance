/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        card: "#151b2c",
        border: "#242e47",
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          soft: "rgba(59, 130, 246, 0.1)",
        },
        success: {
          DEFAULT: "#10b981",
          hover: "#059669",
          soft: "rgba(16, 185, 129, 0.1)",
        },
        danger: {
          DEFAULT: "#f43f5e",
          hover: "#e11d48",
          soft: "rgba(244, 63, 94, 0.1)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          hover: "#d97706",
          soft: "rgba(245, 158, 11, 0.1)",
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(59, 130, 246, 0.15)',
      },
      backdropBlur: {
        glass: '12px',
      }
    },
  },
  plugins: [],
}
