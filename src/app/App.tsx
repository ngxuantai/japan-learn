import attributionUrl from '@/data/ATTRIBUTION.md?url'
import { KanaPage } from '@/features/kana'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { AppProviders } from './providers'

export function App() {
  return (
    <AppProviders>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung chính
      </a>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-5">
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
          <ThemeToggle />
        </header>

        <main id="main" className="flex-1 pb-12">
          <KanaPage />
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
