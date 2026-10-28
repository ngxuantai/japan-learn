import { useState } from 'react'
import attributionUrl from '@/data/ATTRIBUTION.md?url'
import { KanaPage } from '@/features/kana'
import { ReviewPage } from '@/features/review'
import { tabPanelProps } from '@/shared/ui/tabIds'
import { Tabs } from '@/shared/ui/Tabs'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { AppProviders } from './providers'

type Page = 'learn' | 'review'

const PAGES: readonly { id: Page; label: string }[] = [
  { id: 'learn', label: 'Bảng chữ cái' },
  { id: 'review', label: 'Ôn tập' },
]

export function App() {
  const [page, setPage] = useState<Page>('learn')

  return (
    <AppProviders>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung chính
      </a>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-accent font-jp-serif text-xl text-white dark:text-paper"
            >
              あ
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight">Bảng chữ cái tiếng Nhật</p>
              <p className="text-sm text-muted">Hiragana & Katakana cho người mới bắt đầu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tabs
              items={PAGES}
              value={page}
              onChange={setPage}
              label="Trang"
              idPrefix="app-page"
              variant="pill"
              size="sm"
            />
            <ThemeToggle />
          </div>
        </header>

        <main id="main" className="flex-1 pb-12">
          <div {...tabPanelProps('app-page', page)}>
            {page === 'learn' ? <KanaPage /> : <ReviewPage />}
          </div>
        </main>

        <footer className="border-t border-line py-6 text-xs leading-relaxed text-muted">
          Dữ liệu nét vẽ:{' '}
          <a
            href="https://kanjivg.tagaini.net"
            className="underline underline-offset-2 hover:text-ink"
          >
            KanjiVG
          </a>{' '}
          © Ulrich Apel, giấy phép{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            className="underline underline-offset-2 hover:text-ink"
          >
            CC BY-SA 3.0
          </a>
          . Phát âm:{' '}
          <a
            href="https://voicevox.hiroshiba.jp"
            className="underline underline-offset-2 hover:text-ink"
          >
            VOICEVOX:No.7
          </a>
          .{' '}
          <a href={attributionUrl} className="underline underline-offset-2 hover:text-ink">
            Xem ghi nguồn đầy đủ
          </a>
          .
        </footer>
      </div>
    </AppProviders>
  )
}
