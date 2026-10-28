/**
 * Logic một phiên ôn tập, viết dạng hàm thuần (nhận state cũ → trả state mới) để dễ kiểm thử.
 *
 * Luật: hỏi lần lượt các chữ đã chọn theo thứ tự xáo trộn; chữ trả lời sai được đưa
 * về cuối hàng đợi và hỏi lại cho tới khi đúng. Phiên kết thúc khi hàng đợi rỗng.
 */

/** 'read': nhìn chữ → gõ romaji · 'write': nhìn romaji → viết chữ. */
export type ReviewMode = 'read' | 'write'

export interface LastAnswer {
  uid: string
  correct: boolean
  /** Romaji người học đã gõ (kiểu "read"). */
  input?: string
  /** Điểm viết tay 0..100 (kiểu "write"). */
  score?: number
  /** Người học tự công nhận là đúng dù máy chấm trượt. */
  overridden?: boolean
}

export interface ReviewSession {
  mode: ReviewMode
  /** Toàn bộ uid trong phiên (đã xáo trộn), giữ để làm lại. */
  items: readonly string[]
  /** Hàng đợi câu hỏi; phần tử đầu là câu đang hỏi. */
  queue: readonly string[]
  /** 'asking': đang chờ trả lời · 'answered': đã chấm, chờ sang câu tiếp. */
  phase: 'asking' | 'answered'
  last: LastAnswer | null
  /** Số lần sai của từng chữ. */
  mistakes: Readonly<Record<string, number>>
  /** Số chữ đã trả lời đúng (rời khỏi hàng đợi). */
  doneCount: number
  /** Số thứ tự lượt hỏi, tăng mỗi lần sang câu (dùng làm key reset UI). */
  turn: number
  startedAt: number
  /** Có giá trị khi phiên kết thúc (hết câu hoặc người học bấm Kết thúc). */
  finishedAt: number | null
}

export function shuffle<T>(list: readonly T[], random = Math.random): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export function createSession(
  uids: readonly string[],
  mode: ReviewMode,
  now = Date.now(),
): ReviewSession {
  const items = shuffle(uids)
  return {
    mode,
    items,
    queue: items,
    phase: 'asking',
    last: null,
    mistakes: {},
    doneCount: 0,
    turn: 0,
    startedAt: now,
    finishedAt: items.length ? null : now,
  }
}

export function currentUid(s: ReviewSession): string | null {
  return s.finishedAt === null ? (s.queue[0] ?? null) : null
}

/** Ghi nhận câu trả lời cho câu đang hỏi. */
export function submitAnswer(s: ReviewSession, answer: Omit<LastAnswer, 'uid'>): ReviewSession {
  const uid = currentUid(s)
  if (!uid || s.phase !== 'asking') return s
  return {
    ...s,
    phase: 'answered',
    last: { uid, ...answer },
    mistakes: answer.correct ? s.mistakes : { ...s.mistakes, [uid]: (s.mistakes[uid] ?? 0) + 1 },
  }
}

/** Người học tự công nhận đúng sau khi máy chấm trượt: hoàn lại lần sai vừa ghi. */
export function overrideAsCorrect(s: ReviewSession): ReviewSession {
  const last = s.last
  if (s.phase !== 'answered' || !last || last.correct) return s
  const mistakes = { ...s.mistakes }
  const left = (mistakes[last.uid] ?? 1) - 1
  if (left > 0) mistakes[last.uid] = left
  else delete mistakes[last.uid]
  return { ...s, mistakes, last: { ...last, correct: true, overridden: true } }
}

/** Sang câu tiếp: đúng → bỏ khỏi hàng đợi, sai → đưa về cuối hàng đợi. */
export function nextQuestion(s: ReviewSession, now = Date.now()): ReviewSession {
  const head = s.queue[0]
  if (s.phase !== 'answered' || !s.last || head === undefined) return s
  const rest = s.queue.slice(1)
  const queue = s.last.correct ? rest : [...rest, head]
  return {
    ...s,
    queue,
    doneCount: s.doneCount + (s.last.correct ? 1 : 0),
    turn: s.turn + 1,
    phase: 'asking',
    last: null,
    finishedAt: queue.length ? null : now,
  }
}

export function finishSession(s: ReviewSession, now = Date.now()): ReviewSession {
  return s.finishedAt === null ? { ...s, finishedAt: now } : s
}

export interface SessionSummary {
  total: number
  /** Số chữ trả lời đúng ngay lần đầu. */
  firstTry: number
  /** Số chữ đã hoàn thành (đúng ở lần nào đó). */
  done: number
  /** Các chữ từng sai, nhiều lần sai nhất trước. */
  missed: { uid: string; count: number }[]
  durationMs: number
  /** Kết thúc sớm trước khi hết hàng đợi. */
  incomplete: boolean
}

export function summarize(s: ReviewSession): SessionSummary {
  const missed = Object.entries(s.mistakes)
    .map(([uid, count]) => ({ uid, count }))
    .sort((a, b) => b.count - a.count)
  // Chữ đã hoàn thành mà từng sai thì không tính là đúng lần đầu.
  const doneButMissed = missed.filter((m) => !s.queue.includes(m.uid)).length
  return {
    total: s.items.length,
    firstTry: s.doneCount - doneButMissed,
    done: s.doneCount,
    missed,
    durationMs: (s.finishedAt ?? Date.now()) - s.startedAt,
    incomplete: s.queue.length > 0,
  }
}
