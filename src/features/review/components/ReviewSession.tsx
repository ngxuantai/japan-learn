import { useState, type FormEvent, type ReactNode } from 'react'
import { KANA_BY_UID, type Kana } from '@/data/kana'
import { WritingCanvas } from '@/features/kana/components/WritingCanvas'
import { useAudio } from '@/features/kana/hooks/useAudio'
import type { ScoreResult } from '@/features/kana/lib/scoring'
import { Icon } from '@/shared/ui/Icon'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { isCorrectRomaji, writingHint } from '../lib/romaji'
import { currentUid, type LastAnswer, type ReviewSession as Session } from '../lib/session'
import { useReviewStore } from '../store/reviewStore'

/** Điểm viết tay tối thiểu để tính là đúng. */
const WRITE_PASS_SCORE = 60

const SCRIPT_LABEL = { hiragana: 'Hiragana', katakana: 'Katakana' } as const

export function ReviewSession({ session }: { session: Session }) {
  const finish = useReviewStore((s) => s.finish)
  const uid = currentUid(session)
  const kana = uid ? KANA_BY_UID.get(uid) : undefined
  if (!kana) return null

  // Đổi key mỗi lượt hỏi → reset ô nhập / khung viết, kể cả khi một chữ bị hỏi lại liền.
  const key = `${kana.uid}:${session.turn}`

  return (
    <div className="mx-auto max-w-xl animate-fade-up space-y-6">
      <h1 className="sr-only">Ôn tập</h1>
      <div className="flex items-end gap-4">
        <ProgressBar
          className="flex-1"
          value={session.doneCount}
          max={session.items.length}
          label={`Còn ${session.queue.length} câu`}
        />
        <button type="button" className="btn" onClick={finish}>
          Kết thúc
        </button>
      </div>

      {session.mode === 'read' ? (
        <ReadQuestion key={key} kana={kana} session={session} />
      ) : (
        <WriteQuestion key={key} kana={kana} session={session} />
      )}
    </div>
  )
}

interface QuestionProps {
  kana: Kana
  session: Session
}

/** Kiểu 1: nhìn chữ → gõ romaji. Enter để kiểm tra, Enter lần nữa để sang câu. */
function ReadQuestion({ kana, session }: QuestionProps) {
  const submit = useReviewStore((s) => s.submit)
  const next = useReviewStore((s) => s.next)
  const [input, setInput] = useState('')
  const answered = session.phase === 'answered'

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (answered) next()
    else if (input.trim()) submit({ correct: isCorrectRomaji(kana, input), input: input.trim() })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <QuestionCard caption={`${SCRIPT_LABEL[kana.script]} · đọc là gì?`}>
        <span lang="ja" className="font-jp text-7xl leading-none sm:text-8xl">
          {kana.char}
        </span>
      </QuestionCard>

      <div className="flex gap-2">
        <label htmlFor="review-romaji" className="sr-only">
          Romaji
        </label>
        <input
          id="review-romaji"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          readOnly={answered}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={answered ? 'next' : 'done'}
          placeholder="Gõ romaji, vd: ka"
          className={`min-w-0 flex-1 rounded-xl border-2 bg-surface px-4 py-2.5 text-lg outline-none transition-colors focus:border-accent ${
            answered ? (session.last?.correct ? 'border-matcha' : 'border-accent') : 'border-line'
          }`}
        />
        {answered ? (
          <button type="submit" className="btn-primary px-4">
            Tiếp <Icon name="chevronRight" />
          </button>
        ) : (
          <button type="submit" className="btn-primary px-4" disabled={!input.trim()}>
            <Icon name="check" /> Kiểm tra
          </button>
        )}
      </div>

      {answered && session.last ? (
        <Feedback kana={kana} last={session.last} />
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            className="text-sm text-muted underline underline-offset-2 hover:text-ink"
            onClick={() => submit({ correct: false, input: '' })}
          >
            Không nhớ, xem đáp án
          </button>
        </div>
      )}
    </form>
  )
}

/** Kiểu 2: nhìn romaji → viết tay chữ Nhật, máy chấm bằng scoreDrawing. */
function WriteQuestion({ kana, session }: QuestionProps) {
  const submit = useReviewStore((s) => s.submit)
  const next = useReviewStore((s) => s.next)
  const answered = session.phase === 'answered'
  const hint = writingHint(kana)

  const onScore = (r: ScoreResult | null) => {
    const score = r?.score ?? 0
    submit({ correct: score >= WRITE_PASS_SCORE, score })
  }

  return (
    <div className="space-y-5">
      <QuestionCard caption={`Viết chữ ${SCRIPT_LABEL[kana.script]}`}>
        <span className="text-5xl font-semibold leading-none tracking-wide sm:text-6xl">
          {kana.romaji}
        </span>
        {hint && <span className="mt-2 block text-sm text-muted">({hint})</span>}
      </QuestionCard>

      <WritingCanvas text={kana.char} variant="quiz" locked={answered} onScore={onScore} />

      {answered && session.last ? (
        <>
          <Feedback kana={kana} last={session.last} />
          <div className="flex justify-end">
            <button type="button" className="btn-primary px-4" autoFocus onClick={next}>
              Tiếp <Icon name="chevronRight" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            className="text-sm text-muted underline underline-offset-2 hover:text-ink"
            onClick={() => submit({ correct: false, score: 0 })}
          >
            Không nhớ, xem đáp án
          </button>
        </div>
      )}
    </div>
  )
}

function QuestionCard({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
      <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted">{caption}</p>
      <div>{children}</div>
    </div>
  )
}

/** Kết quả sau khi trả lời: đúng/sai, đáp án, nút nghe và (kiểu viết) nút tự công nhận. */
function Feedback({ kana, last }: { kana: Kana; last: LastAnswer }) {
  const override = useReviewStore((s) => s.override)
  const { play, currentUid: playingUid, isSlow } = useAudio()
  const playing = playingUid === kana.uid && !isSlow
  const isWrite = last.score !== undefined

  return (
    <div
      aria-live="polite"
      className={`animate-fade-up rounded-xl border-2 p-4 ${
        last.correct ? 'border-matcha/50 bg-matcha/[0.07]' : 'border-accent/40 bg-accent/[0.05]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white dark:text-paper ${
            last.correct ? 'bg-matcha' : 'bg-accent'
          }`}
        >
          <Icon name={last.correct ? 'check' : 'close'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {last.correct ? (last.overridden ? 'Đã tính là đúng' : 'Chính xác!') : 'Chưa đúng'}
            {isWrite && last.score! > 0 && (
              <span className="ml-2 text-sm font-normal tabular-nums text-muted">
                Điểm viết: {last.score}%
              </span>
            )}
          </p>
          <p className="text-sm text-muted">
            Đáp án:{' '}
            <span lang="ja" className="font-jp text-base text-ink">
              {kana.char}
            </span>{' '}
            = <span className="font-semibold text-ink">{kana.romaji}</span>
            {!last.correct && last.input && (
              <>
                {' '}
                · bạn gõ <span className="line-through">{last.input}</span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${playing ? 'animate-pulse-ring' : ''}`}
          onClick={() => void play(kana)}
        >
          <Icon name="speaker" /> Nghe
        </button>
      </div>
      {isWrite && !last.correct && last.score! > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-accent/20 pt-3 text-sm text-muted">
          <span>So nét của bạn với chữ mẫu (màu xanh) ở khung trên.</span>
          <button type="button" className="btn" onClick={override}>
            <Icon name="check" /> Tôi viết đúng
          </button>
        </div>
      )}
    </div>
  )
}
