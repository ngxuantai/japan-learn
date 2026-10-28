import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { Icon } from '@/shared/ui/Icon'
import { buildGlyph } from '../lib/glyph'
import { drawInkStroke, type InkPoint, type InkStroke } from '../lib/ink'
import { scoreDrawing, type ScoreResult } from '../lib/scoring'
import { GlyphGuides } from './GlyphGuides'

type Mode = 'trace' | 'free'
type PenId = 'thin' | 'medium' | 'thick'

const MODES: readonly { id: Mode; label: string }[] = [
  { id: 'trace', label: 'Tô theo' },
  { id: 'free', label: 'Viết tự do' },
]

/** Độ dày bút theo đơn vị viewBox (109 = cả ô). */
const PENS: readonly { id: PenId; label: string; width: number }[] = [
  { id: 'thin', label: 'Mảnh', width: 3.5 },
  { id: 'medium', label: 'Vừa', width: 5.5 },
  { id: 'thick', label: 'Đậm', width: 8 },
]

const readInkColor = () =>
  `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '31 31 31'})`

interface WritingCanvasProps {
  text: string
  /**
   * 'practice': tập viết, có chế độ tô theo và thẻ điểm chi tiết.
   * 'quiz': ôn tập, luôn viết tự do (ẩn chữ mẫu), kết quả trả ra qua `onScore`.
   */
  variant?: 'practice' | 'quiz'
  /** Chỉ dùng với 'quiz': khoá khung viết và hiện chữ mẫu mờ để so sánh. */
  locked?: boolean
  onScore?: (result: ScoreResult | null) => void
}

/**
 * Khung tập viết. Lớp dưới là SVG (lưới + chữ mẫu mờ dựng từ chính dữ liệu stroke),
 * lớp trên là <canvas> nhận Pointer Events (chuột, cảm ứng, bút).
 * Nét được lưu theo toạ độ viewBox nên đổi kích thước khung không làm lệch nét đã viết.
 */
export function WritingCanvas({
  text,
  variant = 'practice',
  locked = false,
  onScore,
}: WritingCanvasProps) {
  const glyph = buildGlyph(text)
  const isQuiz = variant === 'quiz'
  const [modeState, setMode] = useState<Mode>('trace')
  const mode: Mode = isQuiz ? 'free' : modeState
  const showModel = mode === 'trace' || (isQuiz && locked)
  const [pen, setPen] = useState<PenId>('medium')
  const [strokes, setStrokes] = useState<InkStroke[]>([])
  const [result, setResult] = useState<ScoreResult | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<InkStroke[]>([])
  const currentRef = useRef<InkStroke | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, dpr: 1 })
  const rafRef = useRef(0)

  const penWidth = PENS.find((p) => p.id === pen)!.width

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { w, dpr } = sizeRef.current
    const scale = (w / glyph.width) * dpr
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    const color = readInkColor()
    for (const s of strokesRef.current) drawInkStroke(ctx, s, color)
    if (currentRef.current) drawInkStroke(ctx, currentRef.current, color)
  }, [glyph.width])

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      redraw()
    })
  }, [redraw])

  // Kích thước canvas = kích thước hiển thị × devicePixelRatio để nét sắc trên màn hình Retina.
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { w: rect.width, dpr }
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      redraw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    // Đổi giao diện sáng/tối → vẽ lại với màu mực mới.
    const mo = new MutationObserver(redraw)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [redraw])

  useEffect(() => {
    strokesRef.current = strokes
    redraw()
  }, [strokes, redraw])

  const toPoint = (e: globalThis.PointerEvent, rect: DOMRect): InkPoint => ({
    x: ((e.clientX - rect.left) / rect.width) * glyph.width,
    y: ((e.clientY - rect.top) / rect.height) * glyph.height,
    // Chỉ bút cảm ứng báo lực nhấn đáng tin cậy; chuột/ngón tay dùng 0.5 (độ dày chuẩn).
    p: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5,
  })

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (locked || pointerIdRef.current !== null) return // bỏ qua ngón tay thứ hai
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerIdRef.current = e.pointerId
    const rect = e.currentTarget.getBoundingClientRect()
    currentRef.current = { width: penWidth, points: [toPoint(e.nativeEvent, rect)] }
    scheduleRedraw()
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const cur = currentRef.current
    if (!cur || e.pointerId !== pointerIdRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const native = e.nativeEvent
    // Lấy cả các điểm trung gian trình duyệt gộp lại → nét mượt hơn khi vẽ nhanh.
    const events =
      typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
    for (const ev of events.length ? events : [native]) {
      const pt = toPoint(ev, rect)
      const last = cur.points[cur.points.length - 1]
      if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 0.35) continue
      cur.points.push(pt)
    }
    scheduleRedraw()
  }

  const endStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    const cur = currentRef.current
    if (!cur || e.pointerId !== pointerIdRef.current) return
    currentRef.current = null
    pointerIdRef.current = null
    setStrokes((prev) => [...prev, cur])
    setResult(null)
  }

  const undo = () => {
    setStrokes((prev) => prev.slice(0, -1))
    setResult(null)
  }
  const clear = () => {
    setStrokes([])
    setResult(null)
  }
  const check = () => {
    const r = scoreDrawing(glyph, strokes)
    if (isQuiz) onScore?.(r)
    else setResult(r)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!locked && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      undo()
    }
  }

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isQuiz && <Segmented label="Chế độ" items={MODES} value={mode} onChange={setMode} />}
        <Segmented label="Độ dày bút" items={PENS} value={pen} onChange={setPen} />
      </div>

      <div
        ref={wrapRef}
        className="relative mx-auto w-full overflow-hidden rounded-2xl border border-accent/25 bg-paper shadow-inner"
        style={{
          aspectRatio: `${glyph.width} / ${glyph.height}`,
          maxWidth: Math.min(320 * glyph.cells, 560),
        }}
      >
        <svg
          viewBox={`0 0 ${glyph.width} ${glyph.height}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <GlyphGuides glyph={glyph} tone="accent" border={glyph.cells > 1} />
          {showModel && (
            <g
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={6}
              className={isQuiz ? 'stroke-matcha/30' : 'stroke-ink/[0.13]'}
            >
              {glyph.strokes.map((s) => (
                <path key={s.order} d={s.d} transform={`translate(${s.offsetX} ${s.offsetY})`} />
              ))}
            </g>
          )}
          {showModel &&
            glyph.strokes.map((s) => (
              <text
                key={s.order}
                x={s.start[0] - 4}
                y={s.start[1] - 3}
                fontSize={5}
                fontWeight={600}
                textAnchor="middle"
                className="fill-muted/60"
              >
                {s.order}
              </text>
            ))}
        </svg>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={
            isQuiz
              ? 'Khung viết câu trả lời. Dùng chuột, ngón tay hoặc bút để viết.'
              : `Khung tập viết chữ ${text}. Dùng chuột, ngón tay hoặc bút để viết.`
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className={`absolute inset-0 h-full w-full touch-none ${locked ? '' : 'cursor-crosshair'}`}
        />
      </div>

      {!locked && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={undo} disabled={strokes.length === 0}>
            <Icon name="undo" /> Hoàn tác
          </button>
          <button type="button" className="btn" onClick={clear} disabled={strokes.length === 0}>
            <Icon name="trash" /> Xóa
          </button>
          <button
            type="button"
            className="btn-primary ml-auto"
            onClick={check}
            disabled={strokes.length === 0}
          >
            <Icon name={isQuiz ? 'check' : 'sparkle'} /> {isQuiz ? 'Kiểm tra' : 'Chấm điểm'}
          </button>
        </div>
      )}

      {!isQuiz && (
        <>
          <div aria-live="polite">{result && <ScoreCard result={result} />}</div>
          <p className="text-xs text-muted">
            * Chấm điểm tham khảo: chỉ so độ phủ hình dạng với chữ mẫu, chưa kiểm tra thứ tự và
            chiều nét.
          </p>
        </>
      )}
    </div>
  )
}

function ScoreCard({ result }: { result: ScoreResult }) {
  const tone =
    result.score >= 70 ? 'text-matcha' : result.score >= 50 ? 'text-indigo' : 'text-accent'
  return (
    <div className="animate-fade-up rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold tabular-nums ${tone}`}>{result.score}%</span>
        <span className="text-sm font-medium">{result.verdict}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <Meter label="Độ phủ chữ mẫu" value={result.coverage} good="high" />
        <Meter label="Nét thừa" value={result.excess} good="low" />
      </dl>
      {result.tips.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted">
          {result.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Meter({ label, value, good }: { label: string; value: number; good: 'high' | 'low' }) {
  const pct = Math.round(value * 100)
  const ok = good === 'high' ? value >= 0.75 : value <= 0.25
  return (
    <div>
      <dt className="flex justify-between text-muted">
        {label} <span className="font-semibold tabular-nums text-ink">{pct}%</span>
      </dt>
      <dd className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <span
          className={`block h-full rounded-full ${ok ? 'bg-matcha' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </dd>
    </div>
  )
}

function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string
  items: readonly { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-ink/[0.06] p-0.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={value === it.id}
          onClick={() => onChange(it.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            value === it.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
