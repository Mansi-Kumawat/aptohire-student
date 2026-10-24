import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        mist: 'var(--mist)',
        hairline: 'var(--hairline)',
        ink: 'var(--ink)',
        moss: 'var(--moss)',
        verdant: {
          50: 'var(--verdant-50)',
          100: 'var(--verdant-100)',
          300: 'var(--verdant-300)',
          600: 'var(--verdant-600)',
          700: 'var(--verdant-700)',
          800: 'var(--verdant-800)',
        },
        ember: {
          50: 'var(--ember-50)',
          100: 'var(--ember-100)',
          300: 'var(--ember-300)',
          500: 'var(--ember-500)',
          700: 'var(--ember-700)',
        },
        danger: {
          50: 'var(--danger-50)',
          600: 'var(--danger-600)',
        },
      },
      borderRadius: {
        control: 'var(--r-control)',
        panel: 'var(--r-panel)',
        feature: 'var(--r-feature)',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(23, 38, 30, 0.04), 0 1px 2px -1px rgba(23, 38, 30, 0.04)',
        float: 'var(--shadow-1)',
        modal: 'var(--shadow-2)',
        'card-hover': '0 8px 30px -4px rgba(23, 38, 30, 0.12), 0 2px 6px -1px rgba(23, 38, 30, 0.06)',
        'glow-verdant': '0 0 20px -3px rgba(14, 159, 91, 0.25)',
        'glow-ember': '0 0 20px -3px rgba(255, 122, 26, 0.25)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        reveal: 'var(--dur-reveal)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideUp: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideDown: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pulseSubtle: 'pulseSubtle 3s infinite ease-in-out',
        shimmer: 'shimmer 2.5s infinite linear',
      },
    },
  },
  plugins: [],
};

export default config;
