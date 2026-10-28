/**
 * State của phân hệ ôn tập (Zustand): phạm vi chữ đã chọn, kiểu ôn và phiên đang chạy.
 * Chỉ nằm trong bộ nhớ; ôn tập không ghi vào tiến độ học của bảng chữ cái.
 */
import { create } from 'zustand'
import { KANA, type Script } from '@/data/kana'
import { getSectionKana, type Section } from '@/features/kana/lib/sections'
import {
  createSession,
  finishSession,
  nextQuestion,
  overrideAsCorrect,
  submitAnswer,
  type LastAnswer,
  type ReviewMode,
  type ReviewSession,
} from '../lib/session'

interface ReviewState {
  mode: ReviewMode
  /** uid các chữ được chọn để ôn. */
  selected: ReadonlySet<string>
  session: ReviewSession | null

  setMode(mode: ReviewMode): void
  toggleKana(uid: string): void
  /** Chọn cả bảng; nếu bảng đã được chọn đủ thì bỏ chọn cả bảng. */
  toggleTable(script: Script, section: Section): void
  selectAll(): void
  clearSelection(): void

  start(): void
  /** Ôn lại: chỉ các chữ đã sai, hoặc toàn bộ chữ của phiên vừa rồi. */
  restart(onlyMistakes: boolean): void
  submit(answer: Omit<LastAnswer, 'uid'>): void
  override(): void
  next(): void
  finish(): void
  /** Về màn chọn phạm vi. */
  exit(): void
}

/** Giữ thứ tự bảng chữ khi tạo phiên từ Set. */
const inTableOrder = (uids: ReadonlySet<string>) =>
  KANA.filter((k) => uids.has(k.uid)).map((k) => k.uid)

export const useReviewStore = create<ReviewState>()((set, get) => {
  const updateSession = (fn: (s: ReviewSession) => ReviewSession) => {
    const s = get().session
    if (s) set({ session: fn(s) })
  }

  return {
    mode: 'read',
    selected: new Set(getSectionKana('hiragana', 'basic').map((k) => k.uid)),
    session: null,

    setMode: (mode) => set({ mode }),

    toggleKana: (uid) => {
      const selected = new Set(get().selected)
      if (!selected.delete(uid)) selected.add(uid)
      set({ selected })
    },

    toggleTable: (script, section) => {
      const uids = getSectionKana(script, section).map((k) => k.uid)
      const selected = new Set(get().selected)
      const all = uids.every((u) => selected.has(u))
      for (const u of uids) {
        if (all) selected.delete(u)
        else selected.add(u)
      }
      set({ selected })
    },

    selectAll: () => set({ selected: new Set(KANA.map((k) => k.uid)) }),
    clearSelection: () => set({ selected: new Set() }),

    start: () => {
      const { selected, mode } = get()
      if (selected.size) set({ session: createSession(inTableOrder(selected), mode) })
    },

    restart: (onlyMistakes) => {
      const s = get().session
      if (!s) return
      const uids = onlyMistakes ? Object.keys(s.mistakes) : s.items
      if (uids.length) set({ session: createSession(uids, s.mode) })
    },

    submit: (answer) => updateSession((s) => submitAnswer(s, answer)),
    override: () => updateSession(overrideAsCorrect),
    next: () => updateSession((s) => nextQuestion(s)),
    finish: () => updateSession((s) => finishSession(s)),
    exit: () => set({ session: null }),
  }
})
