import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override default colors entirely — no Tailwind default colors in component files
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      canvas: 'var(--bg-canvas)',
      surface: 'var(--bg-surface)',
      'surface-warm': 'var(--bg-surface-warm)',
      'ink-primary': 'var(--ink-primary)',
      'ink-secondary': 'var(--ink-secondary)',
      'ink-tertiary': 'var(--ink-tertiary)',
      'accent-positive': 'var(--accent-positive)',
      'accent-negative': 'var(--accent-negative)',
      'border-hairline': 'var(--border-hairline)',
      'pill-mint-bg': 'var(--pill-mint-bg)',
      'pill-mint-ink': 'var(--pill-mint-ink)',
      'pill-peach-bg': 'var(--pill-peach-bg)',
      'pill-peach-ink': 'var(--pill-peach-ink)',
      'pill-slate-bg': 'var(--pill-slate-bg)',
      'pill-slate-ink': 'var(--pill-slate-ink)',
    },
    extend: {
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Desktop sizes — mobile sizes applied via responsive classes
        'display-1': ['48px', { lineHeight: '1.1', fontWeight: '500' }],
        'display-2': ['36px', { lineHeight: '1.1', fontWeight: '500' }],
        'heading': ['22px', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body': ['15px', { lineHeight: '1.6' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        'mono-lg': ['32px', { lineHeight: '1.1' }],
        'mono-md': ['18px', { lineHeight: '1.4' }],
        'mono-sm': ['14px', { lineHeight: '1.4' }],
        // Mobile variants
        'display-1-mobile': ['32px', { lineHeight: '1.1', fontWeight: '500' }],
        'display-2-mobile': ['28px', { lineHeight: '1.1', fontWeight: '500' }],
        'heading-mobile': ['20px', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg-mobile': ['17px', { lineHeight: '1.65' }],
        'mono-lg-mobile': ['26px', { lineHeight: '1.1' }],
        'mono-md-mobile': ['16px', { lineHeight: '1.4' }],
        'mono-sm-mobile': ['13px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        'pill': '6px',
        'card': '10px',
        'modal': '14px',
        'input': '6px',
      },
      boxShadow: {
        'card-hover': '0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
      spacing: {
        'section-desktop': '64px',
        'section-mobile': '40px',
      },
    },
  },
  plugins: [],
}

export default config
