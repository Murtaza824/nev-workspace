import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        ink: {
          primary: 'var(--color-ink-primary)',
          secondary: 'var(--color-ink-secondary)',
          tertiary: 'var(--color-ink-tertiary)',
        },
        accent: {
          negative: 'var(--color-accent-negative)',
          positive: 'var(--color-accent-positive)',
        },
        stealth: { bg: '#EEEDFE', text: '#3C3489' },
        'job-change': { bg: '#E6F1FB', text: '#0C447C' },
        'hiring-spike': { bg: '#FBEAF0', text: '#72243E' },
        'new-company': { bg: '#E1F5EE', text: '#085041' },
        'build-in-public': { bg: '#FAEEDA', text: '#633806' },
        'fit-high': '#0F6E56',
      },
      borderWidth: {
        hairline: '0.5px',
      },
    },
  },
  plugins: [],
}

export default config
