import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import type { Kana, Script } from '@/data/kana'
import { Icon } from '@/shared/ui/Icon'
import { useAudio } from '../hooks/useAudio'
import { STATUS_LABEL, STATUS_ORDER } from '../lib/describe'
import { getGridModel, SCRIPTS, SECTIONS, type GridModel, type Section } from '../lib/sections'
import { useKanaStore } from '../store/kanaStore'
import { KanaCell } from './KanaCell'
import { StatusDot } from './StatusDot'

interface Pos {
  r: number
  /** 0 = nút "Phát cả hàng", 1..n = ô chữ. */
  c: number
}

const posKey = (p: Pos) => `${p.r}:${p.c}`

function findPos(model: GridModel, uid: string | null): Pos | null {
  if (!uid) return null
  for (let r = 0; r < model.rows.length; r++) {
    const c = model.rows[r]!.cells.findIndex((k) => k?.uid === uid)
    if (c >= 0) return { r, c: c + 1 }
  }
  return null
}

interface KanaGridProps {
  script: Script
  section: Section
}

/**
 * Bảng chữ dạng ARIA grid. Chỉ một phần tử có tabIndex=0 (roving tabindex):
 * ←↑→↓ di chuyển (bỏ qua ô trống), Home/End đầu/cuối hàng, Ctrl+Home/End đầu/cuối bảng.
 */
export function KanaGrid({ script, section }: KanaGridProps) {
  const model = getGridModel(script, section)
  const selectedUid = useKanaStore((s) => s.selectedUid)
  const select = useKanaStore((s) => s.select)
  const showRomaji = useKanaStore((s) => s.showRomaji)
  const { sequenceKey, playSequence, stop } = useAudio()

  const [focus, setFocus] = useState<Pos>(() => findPos(model, selectedUid) ?? { r: 0, c: 1 })
  // Khi chữ được chọn từ nơi khác (nút trước/sau), đưa vị trí focus của lưới theo.
  const [syncedUid, setSyncedUid] = useState(selectedUid)
  if (selectedUid !== syncedUid) {
    setSyncedUid(selectedUid)
    const p = findPos(model, selectedUid)
    if (p) setFocus(p)
  }

  const refs = useRef(new Map<string, HTMLElement>())
  const registerRef = useCallback((key: string, el: HTMLElement | null) => {
    if (el) refs.current.set(key, el)
    else refs.current.delete(key)
  }, [])

  const onSelect = useCallback((k: Kana) => select(k.uid), [select])

  const cols = model.cols.length
  const navigable = (r: number, c: number) =>
    r >= 0 &&
    r < model.rows.length &&
    c >= 0 &&
    c <= cols &&
    (c === 0 || !!model.rows[r]!.cells[c - 1])

  const scan = (from: Pos, dr: number, dc: number): Pos | null => {
    let { r, c } = from
    for (;;) {
      r += dr
      c += dc
      if (r < 0 || r >= model.rows.length || c < 0 || c > cols) return null
      if (navigable(r, c)) return { r, c }
    }
  }
  const edge = (r: number, last: boolean): Pos | null => {
    for (let i = 0; i <= cols; i++) {
      const c = last ? cols - i : i
      if (navigable(r, c)) return { r, c }
    }
    return null
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const raw = (e.target as HTMLElement).closest<HTMLElement>('[data-pos]')?.dataset.pos
    if (!raw) return
    const [r, c] = raw.split(':').map(Number) as [number, number]
    const here = { r, c }
    const lastRow = model.rows.length - 1
    let next: Pos | null
    switch (e.key) {
      case 'ArrowRight':
        next = scan(here, 0, 1)
        break
      case 'ArrowLeft':
        next = scan(here, 0, -1)
        break
      case 'ArrowDown':
        next = scan(here, 1, 0)
        break
      case 'ArrowUp':
        next = scan(here, -1, 0)
        break
      case 'Home':
        next = edge(e.ctrlKey || e.metaKey ? 0 : r, false)
        break
      case 'End':
        next = edge(e.ctrlKey || e.metaKey ? lastRow : r, true)
        break
      default:
        return
    }
    e.preventDefault()
    if (!next) return
    setFocus(next)
    refs.current.get(posKey(next))?.focus()
  }

  const scriptLabel = SCRIPTS.find((s) => s.id === script)!.label
  const sectionLabel = SECTIONS.find((s) => s.id === section)!.label
  const template = { gridTemplateColumns: `2.25rem repeat(${cols}, minmax(0, 1fr))` }

  return (
    <div>
      <div
        role="grid"
        aria-label={`Bảng ${scriptLabel} – ${sectionLabel}`}
        aria-rowcount={model.rows.length + 1}
        aria-colcount={cols + 1}
        onKeyDown={onKeyDown}
        className="space-y-1.5 sm:space-y-2"
      >
        <div role="row" aria-rowindex={1} className="grid gap-1.5 sm:gap-2" style={template}>
          <div role="columnheader">
            <span className="sr-only">Hàng</span>
          </div>
          {model.cols.map((col) => (
            <div
              key={col}
              role="columnheader"
              className="pb-0.5 text-center text-[11px] font-semibold uppercase tracking-widest text-muted"
            >
              {col}
            </div>
          ))}
        </div>

        {model.rows.map((row, r) => {
          const rowKana = row.cells.filter((k): k is Kana => !!k)
          const seqKey = `${script}:${section}:${row.key}`
          const rowActive = sequenceKey === seqKey
          const headerPos = posKey({ r, c: 0 })
          return (
            <div
              key={row.key}
              role="row"
              aria-rowindex={r + 2}
              className="grid gap-1.5 sm:gap-2"
              style={template}
            >
              <div role="rowheader" className="flex">
                <button
                  ref={(el) => registerRef(headerPos, el)}
                  type="button"
                  data-pos={headerPos}
                  tabIndex={focus.r === r && focus.c === 0 ? 0 : -1}
                  onClick={() => (rowActive ? stop() : void playSequence(rowKana, seqKey))}
                  aria-label={
                    rowActive
                      ? 'Dừng phát hàng này'
                      : `Phát cả hàng: ${rowKana.map((k) => k.char).join(' ')}`
                  }
                  title={rowActive ? 'Dừng' : 'Phát cả hàng'}
                  className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg transition-colors hover:bg-ink/5 hover:text-accent ${
                    rowActive ? 'text-accent' : 'text-muted'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase leading-none">{row.label}</span>
                  <Icon name={rowActive ? 'stop' : 'play'} className="h-3 w-3" />
                </button>
              </div>
              {row.cells.map((kana, i) => {
                const pos = posKey({ r, c: i + 1 })
                return kana ? (
                  <KanaCell
                    key={kana.uid}
                    kana={kana}
                    pos={pos}
                    tabIndex={focus.r === r && focus.c === i + 1 ? 0 : -1}
                    selected={kana.uid === selectedUid}
                    showRomaji={showRomaji}
                    registerRef={registerRef}
                    onSelect={onSelect}
                  />
                ) : (
                  <div
                    key={pos}
                    role="gridcell"
                    aria-disabled="true"
                    aria-label="Ô trống"
                    className="h-14 rounded-xl border-2 border-dashed border-line/70 opacity-50 sm:h-[4.5rem]"
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
        aria-label="Chú thích trạng thái"
      >
        {STATUS_ORDER.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <StatusDot status={s} />
            {STATUS_LABEL[s]}
          </li>
        ))}
      </ul>
    </div>
  )
}
