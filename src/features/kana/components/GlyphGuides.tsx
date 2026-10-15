import type { Glyph } from '../lib/glyph'

interface GlyphGuidesProps {
  glyph: Glyph
  /** "ink": lưới mờ trung tính (xem nét). "accent": lưới đỏ nhạt kiểu giấy tập viết. */
  tone?: 'ink' | 'accent'
  border?: boolean
}

/** Lưới chữ thập chia 4 phần cho mỗi ô ký tự — vẽ trong cùng hệ toạ độ với glyph. */
export function GlyphGuides({ glyph, tone = 'ink', border = false }: GlyphGuidesProps) {
  const s = glyph.cellSize
  const h = glyph.height
  return (
    <g
      aria-hidden="true"
      fill="none"
      strokeWidth={0.7}
      className={tone === 'accent' ? 'stroke-accent/35' : 'stroke-ink/15'}
    >
      {Array.from({ length: glyph.cells }, (_, i) => (
        <g key={i}>
          {border && <rect x={i * s + 0.5} y={0.5} width={s - 1} height={h - 1} rx={3} />}
          <line x1={i * s + s / 2} y1={2} x2={i * s + s / 2} y2={h - 2} strokeDasharray="3 2.5" />
          <line x1={i * s + 2} y1={h / 2} x2={(i + 1) * s - 2} y2={h / 2} strokeDasharray="3 2.5" />
        </g>
      ))}
    </g>
  )
}
