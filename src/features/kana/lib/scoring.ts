/**
 * Chấm điểm sơ bộ (THAM KHẢO): so sánh hình dạng theo điểm ảnh.
 *
 * 1. Rasterize chữ mẫu (từ dữ liệu stroke) và nét người dùng ra canvas ẩn cùng kích thước.
 * 2. Độ phủ   = phần chữ mẫu có mực người dùng ở gần / toàn bộ chữ mẫu.
 * 3. Nét thừa = phần mực người dùng nằm xa chữ mẫu / toàn bộ mực người dùng.
 *
 * Chưa kiểm tra thứ tự nét, chiều nét hay độ cân đối.
 */
import type { Glyph } from './glyph'
import type { InkStroke } from './ink'

export interface ScoreResult {
  /** 0..100 */
  score: number
  /** 0..1 */
  coverage: number
  /** 0..1 */
  excess: number
  userStrokes: number
  expectedStrokes: number
  verdict: string
  tips: string[]
}

/** Chiều cao ảnh raster (px). Nhỏ là đủ và nhanh. */
const RASTER_HEIGHT = 128
/** Độ dày (đơn vị viewBox) khi so khớp: nét "lõi" và vùng dung sai xung quanh. */
const CORE_WIDTH = 4
const TOLERANCE_WIDTH = 18

type Mask = Uint8Array

function rasterize(
  w: number,
  h: number,
  scale: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Mask {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.scale(scale, scale)
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  draw(ctx)
  const { data } = ctx.getImageData(0, 0, w, h)
  const mask = new Uint8Array(w * h)
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3]! > 127 ? 1 : 0
  return mask
}

function drawReference(ctx: CanvasRenderingContext2D, glyph: Glyph, width: number) {
  ctx.lineWidth = width
  for (const s of glyph.strokes) {
    ctx.save()
    ctx.translate(s.offsetX, s.offsetY)
    ctx.stroke(new Path2D(s.d))
    ctx.restore()
  }
}

function drawUser(ctx: CanvasRenderingContext2D, strokes: InkStroke[], width: number) {
  // Dùng độ dày cố định để độ dày bút người dùng chọn không ảnh hưởng điểm.
  ctx.lineWidth = width
  for (const st of strokes) {
    const [first, ...rest] = st.points
    if (!first) continue
    ctx.beginPath()
    if (rest.length === 0) {
      ctx.arc(first.x, first.y, width / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.moveTo(first.x, first.y)
    for (const p of rest) ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
}

const count = (m: Mask) => m.reduce((n, v) => n + v, 0)
const countBoth = (a: Mask, b: Mask, invertB = false) => {
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i] && (invertB ? !b[i] : b[i])) n++
  return n
}

export function scoreDrawing(glyph: Glyph, strokes: InkStroke[]): ScoreResult | null {
  if (strokes.length === 0 || glyph.strokes.length === 0) return null

  const scale = RASTER_HEIGHT / glyph.height
  const w = Math.ceil(glyph.width * scale)
  const h = RASTER_HEIGHT
  const target = rasterize(w, h, scale, (ctx) => drawReference(ctx, glyph, CORE_WIDTH))
  const zone = rasterize(w, h, scale, (ctx) => drawReference(ctx, glyph, TOLERANCE_WIDTH))
  const user = rasterize(w, h, scale, (ctx) => drawUser(ctx, strokes, CORE_WIDTH))
  const userZone = rasterize(w, h, scale, (ctx) => drawUser(ctx, strokes, TOLERANCE_WIDTH))

  const targetPx = count(target)
  const userPx = count(user)
  const coverage = targetPx ? countBoth(target, userZone) / targetPx : 0
  const excess = userPx ? countBoth(user, zone, true) / userPx : 1

  const score = Math.round(Math.max(0, Math.min(1, coverage * (1 - 0.8 * excess))) * 100)
  const expectedStrokes = glyph.strokes.length
  const userStrokes = strokes.length

  const verdict =
    score >= 85
      ? 'Tuyệt vời! Nét chữ rất sát mẫu.'
      : score >= 70
        ? 'Khá tốt! Chỉ cần chỉnh thêm một chút.'
        : score >= 50
          ? 'Tạm được – hãy viết chậm và bám theo mẫu hơn.'
          : 'Cần luyện thêm – thử chế độ Tô theo và xem lại thứ tự nét nhé.'

  const tips: string[] = []
  if (userStrokes !== expectedStrokes) {
    tips.push(`Chữ này có ${expectedStrokes} nét, bạn đã viết ${userStrokes} nét.`)
  }
  if (coverage < 0.75) tips.push('Một số phần của chữ còn thiếu hoặc lệch khỏi mẫu.')
  if (excess > 0.25)
    tips.push('Có khá nhiều mực nằm ngoài chữ mẫu – thử viết gọn và đúng vị trí hơn.')
  if (tips.length === 0 && score >= 85) tips.push('Thử chuyển sang Viết tự do để kiểm tra trí nhớ.')

  return { score, coverage, excess, userStrokes, expectedStrokes, verdict, tips }
}
