import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Trạng thái hoạt ảnh: các nét có chỉ số < index đã vẽ xong; nét `index` đang vẽ được `frac` (0..1).
 * index === số nét nghĩa là đã vẽ xong toàn bộ.
 */
export interface StrokeAnimState {
  index: number
  frac: number
}

export type AnimationSpeed = 0.5 | 1 | 2

/** Nghỉ ngắn giữa hai nét để người học kịp nhìn. */
const GAP_MS = 240
/** Thời gian vẽ một nét ở tốc độ 1x: nét dài vẽ lâu hơn. */
export const strokeDurationMs = (length: number) => 280 + length * 9

/** Số nét đang hiển thị (kể cả nét đang vẽ dở). */
const visibleOf = (s: StrokeAnimState, n: number) => Math.min(n, s.index + (s.frac > 0 ? 1 : 0))

interface Options {
  lengths: readonly number[]
  speed: AnimationSpeed
  autoPlay: boolean
  /** Bắt đầu ở trạng thái đã vẽ xong (dùng cho prefers-reduced-motion). */
  startComplete: boolean
}

export function useStrokeAnimation({ lengths, speed, autoPlay, startComplete }: Options) {
  const n = lengths.length
  const [state, setState] = useState<StrokeAnimState>(() =>
    startComplete ? { index: n, frac: 0 } : { index: 0, frac: 0 },
  )
  const [isPlaying, setIsPlaying] = useState(autoPlay && !startComplete && n > 0)

  // Ref để vòng lặp requestAnimationFrame đọc giá trị mới nhất mà không phải khởi động lại.
  const stateRef = useRef(state)
  const speedRef = useRef(speed)
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const commit = useCallback((next: StrokeAnimState) => {
    stateRef.current = next
    setState(next)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    let raf = 0
    let last: number | null = null
    let gap = 0

    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(now - last, 64) * speedRef.current
      last = now
      let { index, frac } = stateRef.current
      if (frac >= 1) {
        gap += dt
        if (gap >= GAP_MS) {
          gap = 0
          index += 1
          frac = 0
        }
      } else {
        frac = Math.min(1, frac + dt / strokeDurationMs(lengths[index] ?? 0))
      }
      commit({ index, frac })
      if (index >= n) {
        setIsPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, lengths, n, commit])

  const play = useCallback(() => {
    if (stateRef.current.index >= n) commit({ index: 0, frac: 0 })
    setIsPlaying(n > 0)
  }, [n, commit])

  const pause = useCallback(() => setIsPlaying(false), [])

  const replay = useCallback(() => {
    commit({ index: 0, frac: 0 })
    setIsPlaying(n > 0)
  }, [n, commit])

  /** Hiện thêm một nét (nét mới được tô màu nhấn). */
  const next = useCallback(() => {
    setIsPlaying(false)
    const s = stateRef.current
    const v = visibleOf(s, n)
    if (v < n) commit({ index: v, frac: 1 })
    else if (s.index < n) commit({ index: n, frac: 0 })
  }, [n, commit])

  /** Bớt một nét. */
  const prev = useCallback(() => {
    setIsPlaying(false)
    const v = visibleOf(stateRef.current, n)
    if (v <= 0) return
    commit(v - 1 === 0 ? { index: 0, frac: 0 } : { index: v - 2, frac: 1 })
  }, [n, commit])

  /** Nhảy tới nét thứ i (0-based): hiện các nét 0..i, nét i được tô màu nhấn. */
  const seek = useCallback(
    (i: number) => {
      setIsPlaying(false)
      commit({ index: Math.max(0, Math.min(n - 1, i)), frac: 1 })
    },
    [n, commit],
  )

  return {
    ...state,
    total: n,
    visible: visibleOf(state, n),
    isPlaying,
    isDone: state.index >= n,
    play,
    pause,
    replay,
    next,
    prev,
    seek,
  }
}
