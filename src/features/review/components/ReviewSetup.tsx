import { useEffect, useId, useRef, useState } from 'react'
import { KANA, type Script } from '@/data/kana'
import { getSectionKana, SCRIPTS, SECTIONS, type Section } from '@/features/kana/lib/sections'
import { Icon } from '@/shared/ui/Icon'
import type { ReviewMode } from '../lib/session'
import { useReviewStore } from '../store/reviewStore'

const MODES: readonly { id: ReviewMode; title: string; desc: string; sample: string }[] = [
  {
    id: 'read',
    title: 'Nhìn chữ → gõ romaji',
    desc: 'Cho chữ Nhật, gõ cách đọc.',
    sample: 'か → ka',
  },
  {
    id: 'write',
    title: 'Nhìn romaji → viết chữ',
    desc: 'Cho cách đọc, viết tay chữ Nhật; máy tự chấm.',
    sample: 'ka → か',
  },
]

/** Màn chọn kiểu ôn và phạm vi chữ (cả bảng, từng chữ, nhiều bảng). */
export function ReviewSetup() {
  const mode = useReviewStore((s) => s.mode)
  const setMode = useReviewStore((s) => s.setMode)
  const count = useReviewStore((s) => s.selected.size)
  const selectAll = useReviewStore((s) => s.selectAll)
  const clearSelection = useReviewStore((s) => s.clearSelection)
  const start = useReviewStore((s) => s.start)

  return (
    <div className="mx-auto max-w-4xl animate-fade-up space-y-8">
      <h1 className="sr-only">Ôn tập</h1>

      <section aria-labelledby="review-mode">
        <h2
          id="review-mode"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted"
        >
          Kiểu ôn
        </h2>
        <div role="radiogroup" aria-labelledby="review-mode" className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => {
            const active = m.id === mode
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(m.id)}
                className={`flex items-start gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition ${
                  active ? 'border-accent shadow-sm' : 'border-line hover:border-ink/30'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                    active ? 'border-accent' : 'border-line'
                  }`}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{m.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{m.desc}</span>
                </span>
                <span lang="ja" className="shrink-0 font-jp text-sm text-muted">
                  {m.sample}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="review-scope">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2
            id="review-scope"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Phạm vi ôn
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn"
              onClick={selectAll}
              disabled={count === KANA.length}
            >
              Chọn tất cả
            </button>
            <button type="button" className="btn" onClick={clearSelection} disabled={count === 0}>
              Bỏ chọn
            </button>
          </div>
        </div>
        <p className="mb-4 text-sm text-muted">
          Tick để chọn cả bảng, hoặc mở bảng ra để chọn từng chữ. Có thể chọn nhiều bảng cùng lúc.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {SCRIPTS.map((s) => (
            <div key={s.id} className="space-y-3">
              <h3 className="flex items-baseline gap-2 font-semibold">
                {s.label}
                <span lang="ja" className="font-jp text-xs font-normal text-muted">
                  {s.native}
                </span>
              </h3>
              {SECTIONS.map((sec) => (
                <TableCard key={sec.id} script={s.id} section={sec.id} label={sec.label} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-center">
        <button
          type="button"
          className="btn-primary px-6 py-2.5 text-base shadow-lift"
          onClick={start}
          disabled={count === 0}
        >
          <Icon name="play" /> Bắt đầu ôn ({count} chữ)
        </button>
      </div>
    </div>
  )
}

function TableCard({
  script,
  section,
  label,
}: {
  script: Script
  section: Section
  label: string
}) {
  const kana = getSectionKana(script, section)
  const selected = useReviewStore((s) => s.selected)
  const toggleTable = useReviewStore((s) => s.toggleTable)
  const toggleKana = useReviewStore((s) => s.toggleKana)
  const [open, setOpen] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>(null)
  const bodyId = useId()

  const count = kana.filter((k) => selected.has(k.uid)).length
  const all = count === kana.length
  const some = count > 0 && !all

  // indeterminate chỉ đặt được qua DOM, không có thuộc tính HTML tương ứng.
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = some
  }, [some])

  return (
    <div
      className={`rounded-xl border bg-surface transition-colors ${
        count ? 'border-accent/40' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={all}
            onChange={() => toggleTable(script, section)}
            className="h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
        </label>
        <span className="text-xs tabular-nums text-muted">
          {count}/{kana.length}
        </span>
        <button
          type="button"
          className="btn-icon h-8 w-8"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? `Thu gọn ${label}` : `Chọn từng chữ trong ${label}`}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon
            name="chevronRight"
            className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </button>
      </div>
      {open && (
        <div id={bodyId} className="flex flex-wrap gap-1.5 border-t border-line p-3">
          {kana.map((k) => {
            const on = selected.has(k.uid)
            return (
              <button
                key={k.uid}
                type="button"
                aria-pressed={on}
                aria-label={`${k.char} (${k.romaji})`}
                onClick={() => toggleKana(k.uid)}
                className={`grid h-10 min-w-10 place-items-center rounded-lg border px-1.5 font-jp text-lg transition ${
                  on
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line text-muted hover:border-ink/30'
                }`}
              >
                <span lang="ja">{k.char}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
