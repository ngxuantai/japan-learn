import type { Config } from 'tailwindcss'

/**
 * Màu được khai báo dạng biến CSS (kênh RGB) trong src/styles/index.css,
 * nên chỉ cần đổi class "dark" trên <html> là toàn bộ bảng màu chuyển theo.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: token('paper'), // nền giấy washi — #FAF7F2
        surface: token('surface'), // thẻ / panel nổi trên nền
        ink: token('ink'), // mực sumi — #1F1F1F
        muted: token('muted'), // chữ phụ
        line: token('line'), // đường kẻ, viền
        accent: token('accent'), // đỏ Nhật — #C8102E
        indigo: token('indigo'), // xanh chàm — #264653
        matcha: token('matcha'), // trạng thái "đã thuộc"
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans JP"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        jp: ['"Noto Sans JP"', '"Hiragino Sans"', '"Yu Gothic"', 'Meiryo', 'sans-serif'],
        'jp-serif': ['"Noto Serif JP"', '"Hiragino Mincho ProN"', '"Yu Mincho"', 'serif'],
      },
      boxShadow: {
        lift: '0 6px 16px -6px rgb(var(--ink) / 0.18)',
        sheet: '0 -8px 32px -8px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        ripple: {
          from: { transform: 'scale(0)', opacity: '0.35' },
          to: { transform: 'scale(2.5)', opacity: '0' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.45)' },
          '50%': { boxShadow: '0 0 0 6px rgb(var(--accent) / 0)' },
        },
      },
      animation: {
        ripple: 'ripple 550ms ease-out forwards',
        'fade-in': 'fade-in 200ms ease-out',
        'fade-up': 'fade-up 240ms ease-out',
        'pulse-ring': 'pulse-ring 900ms ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
