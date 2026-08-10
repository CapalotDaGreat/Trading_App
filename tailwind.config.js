/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          elevated: 'var(--color-background-elevated)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          glass: 'var(--color-surface-glass)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          dark: 'var(--color-accent-dark)',
          muted: 'var(--color-accent-muted)',
        },
        bullish: {
          DEFAULT: 'var(--color-bullish)',
          muted: 'var(--color-bullish-muted)',
        },
        bearish: {
          DEFAULT: 'var(--color-bearish)',
          muted: 'var(--color-bearish-muted)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          muted: 'var(--color-warning-muted)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          muted: 'var(--color-info-muted)',
        },
        premium: {
          DEFAULT: 'var(--color-premium)',
          muted: 'var(--color-premium-muted)',
        },
        focus: 'var(--color-focus)',
        disabled: {
          DEFAULT: 'var(--color-disabled-background)',
          foreground: 'var(--color-disabled-foreground)',
        },
        chart: {
          grid: 'var(--color-chart-grid)',
          axis: 'var(--color-chart-axis)',
          primary: 'var(--color-chart-primary)',
          secondary: 'var(--color-chart-secondary)',
          neutral: 'var(--color-chart-neutral)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          accent: 'var(--color-border-accent)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
          'on-accent': 'var(--color-text-on-accent)',
          'on-danger': 'var(--color-text-on-danger)',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '25px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '31px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '43px' }],
      },
      minHeight: {
        11: '44px',
        13: '52px',
      },
      spacing: {
        'screen-x': '24px',
        'screen-y': '20px',
        section: '36px',
        surface: '20px',
        control: '12px',
      },
      borderRadius: {
        control: '12px',
        card: '16px',
        panel: '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
