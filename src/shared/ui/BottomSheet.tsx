import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** id của tiêu đề bên trong sheet (aria-labelledby). */
  labelledBy?: string
  children: ReactNode
}

const EXIT_MS = 280
const CLOSE_DISTANCE = 110
const CLOSE_VELOCITY = 0.6 // px/ms

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet cho mobile: backdrop, kéo thanh trên cùng xuống để đóng, Esc để đóng,
 * giữ focus bên trong (focus trap) và trả focus về phần tử cũ khi đóng.
 */
export function BottomSheet({ open, onClose, labelledBy, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const drag = useRef<{
    id: number
    startY: number
    dy: number
    lastY: number
    lastT: number
    v: number
  } | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Mở: mount ngay trong render; animation vào chạy ở frame kế tiếp.
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (!mounted) return
    if (open) {
      if (panelRef.current) panelRef.current.style.transform = ''
      const raf = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(raf)
    }
    const t = setTimeout(() => {
      setMounted(false)
      setEntered(false)
    }, EXIT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  // Focus trap, phím Esc, khoá cuộn trang nền.
  useEffect(() => {
    if (!open || !mounted) return
    const panel = panelRef.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel?.focus({ preventScroll: true })
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) {
        e.preventDefault()
        return
      }
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus({ preventScroll: true })
    }
  }, [open, mounted])

  // ===== Kéo để đóng (gắn vào vùng tay cầm) =====
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      dy: 0,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
    }
    if (panelRef.current) panelRef.current.style.transition = 'none'
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    d.dy = Math.max(0, e.clientY - d.startY)
    if (panelRef.current) panelRef.current.style.transform = `translateY(${d.dy}px)`
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || d.id !== e.pointerId || !panel) return
    drag.current = null
    panel.style.transition = ''
    if (d.dy > CLOSE_DISTANCE || d.v > CLOSE_VELOCITY) {
      panel.style.transform = 'translateY(100%)'
      onCloseRef.current()
    } else {
      panel.style.transform = ''
    }
  }

  if (!mounted) return null
  const shown = open && entered

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        aria-hidden="true"
        onClick={() => onCloseRef.current()}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-surface shadow-sheet outline-none transition-transform duration-300 ease-out ${
          shown ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="flex shrink-0 cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing"
        >
          <span className="h-1.5 w-12 rounded-full bg-ink/20" />
          <span className="sr-only">Kéo xuống để đóng</span>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
