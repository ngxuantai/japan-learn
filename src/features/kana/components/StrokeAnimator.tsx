import { useMemo, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { Icon } from '@/shared/ui/Icon'
import { useStrokeAnimation, type AnimationSpeed } from '../hooks/useStrokeAnimation'
import { buildGlyph } from '../lib/glyph'
import { GlyphGuides } from './GlyphGuides'

const SPEEDS: readonly AnimationSpeed[] = [0.5, 1, 2]

/**
 * Hoạt ảnh thứ tự nét: mỗi nét "chạy" bằng stroke-dasharray/dashoffset theo `length` trong strokes.json.
 * Nét đã xong màu mực, nét đang vẽ màu đỏ; số thứ tự đặt tại điểm bắt đầu nét.
 * Với prefers-reduced-motion: hiển thị tĩnh toàn bộ nét + số, chỉ cho bước từng nét.
 */
export function StrokeAnimator({ text }: { text: string }) {
  const glyph = buildGlyph(text)
  const reduced = usePrefersReducedMotion()
  const [speed, setSpeed] = useState<AnimationSpeed>(1)
  const lengths = useMemo(() => glyph.strokes.map((s) => s.length), [glyph])
  const anim = useStrokeAnimation({ lengths, speed, autoPlay: !reduced, startComplete: reduced })

  if (glyph.strokes.length === 0) {
    return <p className="text-sm text-muted">Chưa có dữ liệu nét vẽ cho “{text}”.</p>
  }

  const total = glyph.strokes.length
  const stepLabel = anim.isDone ? `Đủ ${total} nét` : `Nét ${Math.max(anim.visible, 0)}/${total}`

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-2xl border border-line bg-paper"
        style={{ maxWidth: Math.min(300 * glyph.cells, 520) }}
      >
        <svg
          viewBox={`0 0 ${glyph.width} ${glyph.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Thứ tự nét chữ ${text}: tổng ${total} nét`}
        >
          <GlyphGuides glyph={glyph} />

          {/* Bóng mờ của toàn bộ chữ để người học thấy hình dạng tổng thể */}
          <g
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3.5}
            className="stroke-ink/[0.08]"
          >
            {glyph.strokes.map((s) => (
              <path key={s.order} d={s.d} transform={`translate(${s.offsetX} ${s.offsetY})`} />
            ))}
          </g>

          <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5}>
            {glyph.strokes.map((s, i) => {
              if (i < anim.index) {
                return (
                  <path
                    key={s.order}
                    d={s.d}
                    transform={`translate(${s.offsetX} ${s.offsetY})`}
                    className="stroke-ink"
                  />
                )
              }
              if (i === anim.index && anim.frac > 0) {
                return (
                  <path
                    key={s.order}
                    d={s.d}
                    transform={`translate(${s.offsetX} ${s.offsetY})`}
                    className="stroke-accent"
                    strokeDasharray={s.length}
                    strokeDashoffset={s.length * (1 - anim.frac)}
                  />
                )
              }
              return null
            })}
          </g>

          {glyph.strokes.map((s, i) => {
            const shown = i < anim.index || (i === anim.index && anim.frac > 0)
            if (!shown) return null
            const current = i === anim.index
            return (
              <g key={s.order} className={current ? 'text-accent' : 'text-muted'}>
                <circle
                  cx={s.start[0]}
                  cy={s.start[1]}
                  r={4.6}
                  className="fill-surface stroke-current"
                  strokeWidth={0.9}
                />
                <text
                  x={s.start[0]}
                  y={s.start[1]}
                  dy="0.35em"
                  textAnchor="middle"
                  fontSize={5.6}
                  fontWeight={700}
                  className="fill-current"
                >
                  {s.order}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Thanh tiến trình theo nét: bấm vào một đoạn để xem tới nét đó */}
      <div className="flex gap-1" role="group" aria-label="Chọn nét">
        {glyph.strokes.map((s, i) => {
          const fill = i < anim.index ? 1 : i === anim.index ? anim.frac : 0
          return (
            <button
              key={s.order}
              type="button"
              onClick={() => anim.seek(i)}
              aria-label={`Xem tới nét ${s.order}`}
              className="group relative h-6 flex-1 rounded focus-visible:ring-offset-0"
            >
              <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-ink/10 group-hover:bg-ink/20">
                <span
                  className={`block h-full rounded-full ${i === anim.index && !anim.isDone ? 'bg-accent' : 'bg-ink/70'}`}
                  style={{ width: `${fill * 100}%` }}
                />
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn-icon"
            onClick={anim.prev}
            aria-label="Nét trước"
            disabled={anim.visible === 0}
          >
            <Icon name="stepBack" />
          </button>
          {!reduced && (
            <button
              type="button"
              className="btn-primary h-9 w-9 p-0"
              onClick={anim.isPlaying ? anim.pause : anim.play}
              aria-label={anim.isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              <Icon name={anim.isPlaying ? 'pause' : 'play'} />
            </button>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={anim.next}
            aria-label="Nét tiếp theo"
            disabled={anim.isDone}
          >
            <Icon name="stepForward" />
          </button>
          {!reduced && (
            <button
              type="button"
              className="btn-icon"
              onClick={anim.replay}
              aria-label="Phát lại từ đầu"
            >
              <Icon name="replay" />
            </button>
          )}
          <span className="ml-1.5 text-sm tabular-nums text-muted">{stepLabel}</span>
        </div>

        {!reduced && (
          <div
            role="group"
            aria-label="Tốc độ"
            className="inline-flex rounded-lg bg-ink/[0.06] p-0.5"
          >
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                type="button"
                aria-pressed={speed === sp}
                onClick={() => setSpeed(sp)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums transition ${
                  speed === sp ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        )}
      </div>

      {reduced && (
        <p className="text-xs text-muted">
          Hoạt ảnh đã tắt theo cài đặt “giảm chuyển động” của thiết bị. Dùng nút ◀ ▶ để xem từng
          nét.
        </p>
      )}
    </div>
  )
}
