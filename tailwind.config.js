/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        brand: {
          DEFAULT: '#6C3BFF',
          50: '#F3EEFF',
          100: '#E4D9FF',
          200: '#C9B3FF',
          300: '#AE8DFF',
          400: '#9467FF',
          500: '#6C3BFF',
          600: '#5A2FE0',
          700: '#4824B3',
          800: '#371B85',
          900: '#261258',
          glow: 'rgba(108,59,255,0.15)',
        },
        accent: {
          DEFAULT: '#00E5BE',
          50: '#E0FFF9',
          100: '#B3FFED',
          500: '#00E5BE',
          600: '#00B895',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        xl: '12px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(108,59,255,0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
