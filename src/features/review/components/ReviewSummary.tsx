import type { ReactNode } from 'react'
import { KANA_BY_UID } from '@/data/kana'
import { Icon } from '@/shared/ui/Icon'
import { summarize, type ReviewSession } from '../lib/session'
import { useReviewStore } from '../store/reviewStore'

function formatDuration(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m} phút ${s} giây` : `${s} giây`
}

/** Màn tổng kết phiên: điểm đúng lần đầu, thời gian, danh sách chữ đã sai. */
export function ReviewSummary({ session }: { session: ReviewSession }) {
  const restart = useReviewStore((s) => s.restart)
  const exit = useReviewStore((s) => s.exit)
  const sum = summarize(session)
  const pct = sum.total ? Math.round((sum.firstTry / sum.total) * 100) : 0
  const tone = pct >= 80 ? 'text-matcha' : pct >= 50 ? 'text-indigo' : 'text-accent'

  return (
    <div className="mx-auto max-w-xl animate-fade-up space-y-6">
      <h1 className="text-center text-xl font-semibold">
        {sum.incomplete ? 'Đã dừng phiên ôn' : 'Hoàn thành phiên ôn!'}
      </h1>

      <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-5 text-center shadow-sm">
        <Stat label="Đúng ngay lần đầu">
          <span className={tone}>{pct}%</span>
        </Stat>
        <Stat label="Số chữ">
          {sum.firstTry}/{sum.total}
        </Stat>
        <Stat label="Thời gian">
          <span className="text-base">{formatDuration(sum.durationMs)}</span>
        </Stat>
      </div>

      {sum.incomplete && (
        <p className="text-center text-sm text-muted">
          Đã hoàn thành {sum.done}/{sum.total} chữ trước khi kết thúc.
        </p>
      )}

      {sum.missed.length > 0 ? (
        <section aria-labelledby="review-missed">
          <h2
            id="review-missed"
            className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Chữ cần ôn thêm ({sum.missed.length})
          </h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sum.missed.map(({ uid, count }) => {
              const k = KANA_BY_UID.get(uid)
              if (!k) return null
              return (
                <li
                  key={uid}
                  className="rounded-xl border border-accent/30 bg-surface px-2 py-3 text-center"
                >
                  <span lang="ja" className="block font-jp text-3xl leading-none">
                    {k.char}
                  </span>
                  <span className="mt-1.5 block text-sm font-medium">{k.romaji}</span>
                  <span className="block text-xs text-muted">sai {count} lần</span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        !sum.incomplete && <p className="text-center text-matcha">Không sai chữ nào. Tuyệt vời!</p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {sum.missed.length > 0 && (
          <button type="button" className="btn-primary" onClick={() => restart(true)}>
            <Icon name="replay" /> Ôn lại {sum.missed.length} chữ sai
          </button>
        )}
        <button
          type="button"
          className={sum.missed.length ? 'btn' : 'btn-primary'}
          onClick={() => restart(false)}
        >
          <Icon name="replay" /> Ôn lại từ đầu
        </button>
        <button type="button" className="btn" onClick={exit}>
          Đổi phạm vi
        </button>
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-2">
      <p className="text-2xl font-bold tabular-nums">{children}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}
