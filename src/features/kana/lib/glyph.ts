/**
 * Ghép dữ liệu nét vẽ của một hoặc nhiều ký tự (vd âm ghép "きゃ" = き + ゃ) thành một "glyph"
 * đặt cạnh nhau theo chiều ngang. Dùng chung cho StrokeAnimator, WritingCanvas và chấm điểm.
 */
import strokesJson from '@/data/strokes.json'
import type { StrokesFile } from '@/data/strokes.types'

const STROKES = strokesJson as unknown as StrokesFile

export interface GlyphStroke {
  /** Thứ tự nét trong toàn glyph, bắt đầu từ 1. */
  order: number
  char: string
  d: string
  /** Điểm bắt đầu, đã cộng offset → toạ độ trong glyph. */
  start: [number, number]
  length: number
  /** Dịch path gốc (toạ độ của từng ký tự) về vị trí trong glyph. */
  offsetX: number
  offsetY: number
}

export interface Glyph {
  text: string
  width: number
  height: number
  /** Chiều rộng mỗi ô ký tự (109 với KanjiVG). */
  cellSize: number
  cells: number
  strokes: GlyphStroke[]
  /** Ký tự không có trong strokes.json. */
  missing: string[]
}

const FALLBACK_SIZE = 109
const cache = new Map<string, Glyph>()

function parseViewBox(viewBox: string): [number, number, number, number] {
  const [x = 0, y = 0, w = FALLBACK_SIZE, h = FALLBACK_SIZE] = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  return [x, y, w, h]
}

export function buildGlyph(text: string): Glyph {
  const cached = cache.get(text)
  if (cached) return cached

  const chars = Array.from(text)
  const strokes: GlyphStroke[] = []
  const missing: string[] = []
  let cursorX = 0
  let height = FALLBACK_SIZE
  let cellSize = FALLBACK_SIZE

  chars.forEach((char, ci) => {
    const data = STROKES[char]
    if (!data) {
      missing.push(char)
      cursorX += cellSize
      return
    }
    const [minX, minY, w, h] = parseViewBox(data.viewBox)
    if (ci === 0) cellSize = w
    height = Math.max(height, h)
    const offsetX = cursorX - minX
    const offsetY = -minY
    for (const s of data.strokes) {
      strokes.push({
        order: strokes.length + 1,
        char,
        d: s.d,
        start: [s.start[0] + offsetX, s.start[1] + offsetY],
        length: s.length,
        offsetX,
        offsetY,
      })
    }
    cursorX += w
  })

  const glyph: Glyph = {
    text,
    width: cursorX,
    height,
    cellSize,
    cells: chars.length,
    strokes,
    missing,
  }
  cache.set(text, glyph)
  return glyph
}
