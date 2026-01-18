import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Indigo for focused actions
        primary: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Priority colors
        priority: {
          critical: '#ef4444', // P1 - Red-500
          high: '#fb923c', // P2 - Orange-400
          medium: '#94a3b8', // P3 - Slate-400
          low: '#34d399', // P4 - Emerald-400
        },
        // Sentiment colors
        sentiment: {
          negative: '#ef4444',
          neutral: '#94a3b8',
          positive: '#34d399',
        },
        // Dark theme backgrounds
        background: {
          DEFAULT: '#0f172a', // slate-900
          secondary: '#1e293b', // slate-800
          tertiary: '#334155', // slate-700
          hover: '#3f4a5a', // slightly lighter than tertiary
        },
        // Text colors
        foreground: {
          DEFAULT: '#ffffff',
          secondary: '#e2e8f0', // slate-200 - improved contrast
          muted: '#cbd5e1', // slate-300 - improved contrast for WCAG AA
        },
        // Border colors
        border: {
          DEFAULT: '#334155', // slate-700
          muted: '#1e293b', // slate-800
        },
        // Aliases for shadcn compatibility
        muted: {
          DEFAULT: '#1e293b',
          foreground: '#cbd5e1', // slate-300 - improved contrast for WCAG AA
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // High-density typography scale
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px - body
        base: ['1rem', { lineHeight: '1.5rem' }], // 16px - H2
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px - H1
      },
      spacing: {
        // 4px/8px grid system
        0.5: '0.125rem', // 2px
        1: '0.25rem', // 4px
        1.5: '0.375rem', // 6px
        2: '0.5rem', // 8px
        2.5: '0.625rem', // 10px
        3: '0.75rem', // 12px
        4: '1rem', // 16px
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px
        8: '2rem', // 32px
        10: '2.5rem', // 40px
        12: '3rem', // 48px
        16: '4rem', // 64px - left rail width
      },
      width: {
        rail: '4rem', // 64px
        queue: '20rem', // 320px
        'queue-max': '25rem', // 400px
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      borderRadius: {
        DEFAULT: '0.375rem', // 6px
        sm: '0.25rem', // 4px
        md: '0.5rem', // 8px
        lg: '0.75rem', // 12px
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
