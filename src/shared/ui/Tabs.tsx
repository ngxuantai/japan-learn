import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { tabId, tabPanelId } from './tabIds'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** aria-label của tablist. */
  label: string
  /** Tiền tố id, dùng với tabPanelProps(idPrefix, value). */
  idPrefix: string
  variant?: 'pill' | 'underline'
  size?: 'sm' | 'md'
  className?: string
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/**
 * Tab có thanh chỉ báo trượt. Bàn phím: ←/→ (Home/End) để chuyển và chọn tab ngay.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  variant = 'underline',
  size = 'md',
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const readyRef = useRef(false)

  // Đặt vị trí thanh chỉ báo trực tiếp lên DOM (không cần state → không render lại).
  useLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return
    const place = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!active) return
      indicator.style.transition = readyRef.current ? '' : 'none'
      indicator.style.width = `${active.offsetWidth}px`
      indicator.style.transform = `translateX(${active.offsetLeft}px)`
      indicator.style.opacity = '1'
      readyRef.current = true
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(list)
    return () => ro.disconnect()
  }, [value, items])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((t) => t.id === value)
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % items.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + items.length) % items.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? items.length - 1
              : -1
    if (next < 0) return
    e.preventDefault()
    const item = items[next]!
    onChange(item.id)
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(idPrefix, item.id))}`)?.focus()
  }

  const pill = variant === 'pill'

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        'relative',
        pill ? 'inline-flex rounded-xl bg-ink/[0.06] p-1' : 'flex gap-1 border-b border-line',
        className,
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={cx(
          'pointer-events-none absolute left-0 opacity-0 transition-[transform,width] duration-300 ease-out',
          pill
            ? 'inset-y-1 rounded-lg bg-surface shadow-sm'
            : '-bottom-px h-0.5 rounded-full bg-accent',
        )}
      />
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            id={tabId(idPrefix, item.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cx(
              'relative z-10 whitespace-nowrap font-medium transition-colors focus-visible:ring-offset-0',
              pill ? 'rounded-lg' : 'rounded-t-md',
              size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm sm:text-base',
              selected ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
