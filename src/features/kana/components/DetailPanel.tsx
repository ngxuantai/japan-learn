import type { Kana } from '@/data/kana'
import { Icon } from '@/shared/ui/Icon'
import { tabPanelProps } from '@/shared/ui/tabIds'
import { Tabs } from '@/shared/ui/Tabs'
import { useAudio } from '../hooks/useAudio'
import { useKanaStatus } from '../hooks/useKanaProgress'
import { compositionHint, STATUS_LABEL, STATUS_ORDER } from '../lib/describe'
import { getSectionKana, GROUP_LABEL, SCRIPTS, sectionOf } from '../lib/sections'
import { useKanaStore, type DetailTab } from '../store/kanaStore'
import { StatusDot } from './StatusDot'
import { StrokeAnimator } from './StrokeAnimator'
import { WritingCanvas } from './WritingCanvas'

const DETAIL_TABS: readonly { id: DetailTab; label: string }[] = [
  { id: 'stroke', label: 'Nét viết' },
  { id: 'practice', label: 'Tập viết' },
]

interface DetailPanelProps {
  kana: Kana
  headingId: string
  /** Có trên mobile (bottom sheet) để hiện nút đóng. */
  onClose?: () => void
}

export function DetailPanel({ kana, headingId, onClose }: DetailPanelProps) {
  const status = useKanaStatus(kana.uid)
  const setStatus = useKanaStore((s) => s.setStatus)
  const selectAdjacent = useKanaStore((s) => s.selectAdjacent)
  const detailTab = useKanaStore((s) => s.detailTab)
  const setDetailTab = useKanaStore((s) => s.setDetailTab)
  const { play, currentUid, isSlow } = useAudio()

  const list = getSectionKana(kana.script, sectionOf(kana.group))
  const idx = list.findIndex((k) => k.uid === kana.uid)
  const prev = list[idx - 1]
  const next = list[idx + 1]
  const hint = compositionHint(kana)
  const playingNormal = currentUid === kana.uid && !isSlow
  const playingSlow = currentUid === kana.uid && isSlow
  const scriptLabel = SCRIPTS.find((s) => s.id === kana.script)!.label

  return (
    <article aria-labelledby={headingId} className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-muted">
          {scriptLabel} · {GROUP_LABEL[kana.group]}
        </span>
        {onClose && (
          <button
            type="button"
            className="btn-icon rounded-full"
            onClick={onClose}
            aria-label="Đóng"
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      {/* Chữ lớn + chuyển chữ trước/sau */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn-icon rounded-full"
          onClick={() => selectAdjacent(-1)}
          disabled={!prev}
          aria-label={prev ? `Chữ trước: ${prev.char} (${prev.romaji})` : 'Không có chữ trước'}
        >
          <Icon name="chevronLeft" />
        </button>
        <div key={kana.uid} className="animate-fade-in text-center">
          <h2
            id={headingId}
            className="font-jp-serif text-[5.5rem] font-medium leading-none sm:text-[6.5rem]"
          >
            <span className="sr-only">Chữ </span>
            <span lang="ja">{kana.char}</span>
          </h2>
          <p className="mt-2 text-xl font-semibold tracking-wide text-accent">
            <span className="sr-only">đọc là </span>
            {kana.romaji}
          </p>
        </div>
        <button
          type="button"
          className="btn-icon rounded-full"
          onClick={() => selectAdjacent(1)}
          disabled={!next}
          aria-label={next ? `Chữ sau: ${next.char} (${next.romaji})` : 'Không có chữ sau'}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          className={`btn-primary px-4 ${playingNormal ? 'animate-pulse-ring' : ''}`}
          onClick={() => void play(kana)}
        >
          <Icon name="speaker" /> Nghe
        </button>
        <button
          type="button"
          className={`btn px-4 ${playingSlow ? 'animate-pulse-ring' : ''}`}
          onClick={() => void play(kana, { slow: true })}
        >
          <Icon name="slow" /> Nghe chậm
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Trạng thái học
        </legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink/[0.06] p-1">
          {STATUS_ORDER.map((s) => (
            <label key={s} className="relative">
              <input
                type="radio"
                name={`${headingId}-status`}
                value={s}
                checked={status === s}
                onChange={() => void setStatus(kana.uid, s)}
                className="peer sr-only"
              />
              <span className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-muted transition hover:text-ink peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                <StatusDot status={s} />
                {STATUS_LABEL[s]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {kana.mnemonic && (
        <section className="rounded-xl border-l-4 border-accent/70 bg-accent/[0.05] px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Mẹo nhớ</h3>
          <p className="mt-1 leading-relaxed">{kana.mnemonic}</p>
        </section>
      )}

      {hint && (
        <section className="rounded-xl border-l-4 border-indigo/60 bg-indigo/[0.06] px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo">Cấu tạo</h3>
          <p className="mt-1 leading-relaxed">{hint}</p>
        </section>
      )}

      {kana.examples && kana.examples.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Từ ví dụ
          </h3>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {kana.examples.map((ex) => (
              <li
                key={ex.kana}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5"
              >
                <span lang="ja" className="font-jp text-xl">
                  <Highlight text={ex.kana} part={kana.char} />
                </span>
                <span className="text-sm text-muted">{ex.romaji}</span>
                <span className="ml-auto text-sm">{ex.meaningVi}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div>
        <Tabs
          items={DETAIL_TABS}
          value={detailTab}
          onChange={setDetailTab}
          label="Nét viết và tập viết"
          idPrefix="kana-detail"
          size="sm"
        />
        <div
          key={detailTab}
          {...tabPanelProps('kana-detail', detailTab)}
          className="animate-fade-in pt-4"
        >
          {detailTab === 'stroke' ? (
            <StrokeAnimator key={kana.uid} text={kana.char} />
          ) : (
            <WritingCanvas key={kana.uid} text={kana.char} />
          )}
        </div>
      </div>
    </article>
  )
}

/** Tô màu chữ đang học bên trong từ ví dụ. */
function Highlight({ text, part }: { text: string; part: string }) {
  const pieces = text.split(part)
  return (
    <>
      {pieces.map((p, i) => (
        <span key={i}>
          {p}
          {i < pieces.length - 1 && <span className="text-accent">{part}</span>}
        </span>
      ))}
    </>
  )
}
