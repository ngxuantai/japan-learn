import { useState } from 'react'
import { KANA_BY_UID } from '@/data/kana'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Switch } from '@/shared/ui/Switch'
import { tabPanelProps } from '@/shared/ui/tabIds'
import { Tabs } from '@/shared/ui/Tabs'
import { useKanaProgress } from '../hooks/useKanaProgress'
import { getSectionKana, SCRIPTS, SECTIONS } from '../lib/sections'
import { useKanaStore } from '../store/kanaStore'
import { DetailPanel } from './DetailPanel'
import { KanaGrid } from './KanaGrid'

const SCRIPT_TABS = SCRIPTS.map((s) => ({
  id: s.id,
  label: (
    <span className="inline-flex items-baseline gap-2">
      {s.label}
      <span lang="ja" className="hidden font-jp text-xs text-muted sm:inline">
        {s.native}
      </span>
    </span>
  ),
}))

/**
 * Trang bảng chữ cái: tab Hiragana/Katakana, sub-tab nhóm chữ, lưới chữ và panel chi tiết
 * (cột phải trên desktop, bottom sheet trên mobile/tablet).
 */
export function KanaPage() {
  const script = useKanaStore((s) => s.script)
  const section = useKanaStore((s) => s.section)
  const setScript = useKanaStore((s) => s.setScript)
  const setSection = useKanaStore((s) => s.setSection)
  const selectedUid = useKanaStore((s) => s.selectedUid)
  const select = useKanaStore((s) => s.select)
  const showRomaji = useKanaStore((s) => s.showRomaji)
  const toggleRomaji = useKanaStore((s) => s.toggleRomaji)
  const { countMastered } = useKanaProgress()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const selected = selectedUid ? (KANA_BY_UID.get(selectedUid) ?? null) : null
  // Giữ chữ cuối cùng để bottom sheet vẫn có nội dung trong lúc trượt xuống.
  const [sheetKana, setSheetKana] = useState(selected)
  if (selected && selected !== sheetKana) setSheetKana(selected)

  const sectionKana = getSectionKana(script, section)
  const sectionLabel = SECTIONS.find((s) => s.id === section)!.label

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:items-start lg:gap-8">
      <section aria-labelledby="kana-title" className="min-w-0">
        <h1 id="kana-title" className="sr-only">
          Bảng chữ cái Hiragana và Katakana
        </h1>

        <Tabs
          items={SCRIPT_TABS}
          value={script}
          onChange={setScript}
          label="Bảng chữ"
          idPrefix="kana-script"
          variant="pill"
        />

        <div {...tabPanelProps('kana-script', script)} className="mt-4">
          <Tabs
            items={SECTIONS}
            value={section}
            onChange={setSection}
            label="Nhóm chữ"
            idPrefix="kana-section"
            className="overflow-x-auto"
          />

          <div className="my-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <Switch checked={showRomaji} onChange={toggleRomaji} label="Hiện romaji" />
            <ProgressBar
              className="min-w-[11rem] flex-1 sm:max-w-xs"
              value={countMastered(sectionKana)}
              max={sectionKana.length}
              label={`Đã thuộc · ${sectionLabel}`}
            />
          </div>

          <div
            key={`${script}:${section}`}
            {...tabPanelProps('kana-section', section)}
            className="animate-fade-up"
          >
            <KanaGrid script={script} section={section} />
          </div>
        </div>
      </section>

      {isDesktop ? (
        <aside
          aria-label="Chi tiết chữ"
          className="sticky top-4 mt-0 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-sm"
        >
          {selected ? (
            <DetailPanel kana={selected} headingId="kana-detail-title" />
          ) : (
            <EmptyDetail />
          )}
        </aside>
      ) : (
        <BottomSheet open={!!selected} onClose={() => select(null)} labelledBy="kana-sheet-title">
          {sheetKana && (
            <DetailPanel
              kana={sheetKana}
              headingId="kana-sheet-title"
              onClose={() => select(null)}
            />
          )}
        </BottomSheet>
      )}
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="px-4 py-10 text-center">
      <p aria-hidden="true" lang="ja" className="font-jp-serif text-7xl text-ink/15">
        あ
      </p>
      <p className="mt-5 text-ink">
        Chọn một chữ trong bảng để nghe cách đọc, xem thứ tự nét và tập viết.
      </p>
      <p className="mt-3 text-xs text-muted">
        Bàn phím: phím mũi tên để di chuyển · Enter để nghe · Space để chọn
      </p>
    </div>
  )
}
