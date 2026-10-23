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
        float: 'var(--shadow-1)',
        modal: 'var(--shadow-2)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        reveal: 'var(--dur-reveal)',
      },
    },
  },
  plugins: [],
};

export default config;
