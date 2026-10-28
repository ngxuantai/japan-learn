import { memo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { Kana } from '@/data/kana'
import { useIsPlaying } from '../hooks/useAudio'
import { useKanaStatus } from '../hooks/useKanaProgress'
import { kanaAriaLabel } from '../lib/describe'
import { StatusDot } from './StatusDot'

interface KanaCellProps {
  kana: Kana
  /** "r:c" — vị trí trong lưới, dùng cho điều hướng bàn phím. */
  pos: string
  tabIndex: 0 | -1
  selected: boolean
  showRomaji: boolean
  registerRef: (pos: string, el: HTMLElement | null) => void
  onSelect: (kana: Kana) => void
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const STATUS_BORDER = {
  new: 'border-line',
  learning: 'border-indigo/60',
  mastered: 'border-matcha/70 bg-matcha/[0.07]',
} as const

/**
 * Một ô chữ. Tự subscribe trạng thái học & trạng thái phát của chính nó,
 * nên khi một chữ thay đổi chỉ ô đó render lại.
 * Click / Enter / Space: chọn chữ. Âm thanh chỉ phát qua nút Nghe ở panel chi tiết.
 */
export const KanaCell = memo(function KanaCell({
  kana,
  pos,
  tabIndex,
  selected,
  showRomaji,
  registerRef,
  onSelect,
}: KanaCellProps) {
  const status = useKanaStatus(kana.uid)
  const playing = useIsPlaying(kana.uid)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleId = useRef(0)
  const isCombo = kana.char.length > 1

  const addRipple = (el: HTMLElement, clientX?: number, clientY?: number) => {
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = clientX === undefined ? rect.width / 2 : clientX - rect.left
    const y = clientY === undefined ? rect.height / 2 : clientY - rect.top
    const id = ++rippleId.current
    setRipples((r) => [...r, { id, x, y, size }])
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    // e.detail === 0: click sinh ra từ bàn phím/trợ năng → ripple ở giữa ô.
    addRipple(e.currentTarget, e.detail ? e.clientX : undefined, e.detail ? e.clientY : undefined)
    onSelect(kana)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      addRipple(e.currentTarget)
      onSelect(kana)
    }
  }

  return (
    <div
      ref={(el) => registerRef(pos, el)}
      role="gridcell"
      data-pos={pos}
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-label={kanaAriaLabel(kana, status)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[
        'relative flex h-14 cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-surface',
        'transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 focus-visible:z-10 sm:h-[4.5rem]',
        STATUS_BORDER[status],
        selected && 'outline outline-2 outline-offset-2 outline-accent/80',
        playing && 'animate-pulse-ring',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        aria-hidden="true"
        lang="ja"
        className={`font-jp leading-none transition-colors ${
          isCombo ? 'text-xl sm:text-[1.75rem]' : 'text-[1.7rem] sm:text-[2.15rem]'
        } ${playing ? 'text-accent' : 'text-ink'}`}
      >
        {kana.char}
      </span>
      {showRomaji && (
        <span
          aria-hidden="true"
          className="mt-1 text-[11px] font-medium leading-none text-muted sm:text-xs"
        >
          {kana.romaji}
        </span>
      )}
      {status !== 'new' && <StatusDot status={status} className="absolute right-1 top-1" />}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          onAnimationEnd={() => setRipples((list) => list.filter((x) => x.id !== r.id))}
          className="pointer-events-none absolute animate-ripple rounded-full bg-accent/30"
          style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
        />
      ))}
    </div>
  )
})
