import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#008080',
          accent: '#39FF14',
          bgApp: '#F8F9FA',
          bgSurface: '#FFFFFF',
          textPrimary: '#1A1A1A',
          textMuted: '#6C7570',
          hairline: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        token: 'var(--radius)',
      },
      boxShadow: {
        surface: 'var(--shadow)',
      },
      letterSpacing: {
        tight: '-0.05em',
      },
    },
  },
  plugins: [],
};

export default config;
