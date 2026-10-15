/**
 * Vẽ nét mực người dùng lên canvas. Toạ độ điểm tính theo đơn vị viewBox của glyph
 * (không phụ thuộc kích thước canvas) — caller tự setTransform để scale.
 */

export interface InkPoint {
  x: number
  y: number
  /** Lực nhấn 0..1; 0.5 khi thiết bị không hỗ trợ. */
  p: number
}

export interface InkStroke {
  points: InkPoint[]
  /** Độ dày bút (đơn vị viewBox). */
  width: number
}

/** Lực nhấn → hệ số độ dày: 0.5 (mặc định) giữ nguyên độ dày. */
const pressureFactor = (p: number) => 0.45 + p * 1.1

const mid = (a: InkPoint, b: InkPoint): InkPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  p: (a.p + b.p) / 2,
})

/**
 * Làm mượt bằng đường cong bậc hai qua trung điểm: mỗi đoạn đi từ trung điểm (i-1,i) tới
 * trung điểm (i,i+1) với điểm điều khiển là điểm i. Vẽ từng đoạn riêng để độ dày thay đổi theo lực nhấn.
 */
export function drawInkStroke(ctx: CanvasRenderingContext2D, stroke: InkStroke, color: string) {
  const pts = stroke.points
  const first = pts[0]
  if (!first) return
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(first.x, first.y, (stroke.width * pressureFactor(first.p)) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  let from = first
  for (let i = 1; i < pts.length - 1; i++) {
    const ctrl = pts[i]!
    const to = mid(ctrl, pts[i + 1]!)
    ctx.beginPath()
    ctx.lineWidth = stroke.width * pressureFactor(ctrl.p)
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y)
    ctx.stroke()
    from = to
  }
  const last = pts[pts.length - 1]!
  ctx.beginPath()
  ctx.lineWidth = stroke.width * pressureFactor(last.p)
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}
