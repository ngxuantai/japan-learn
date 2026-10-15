import { getKana, type Kana } from '@/data/kana'
import type { LearnStatus } from '../services/progressRepository'

export const STATUS_ORDER: readonly LearnStatus[] = ['new', 'learning', 'mastered']

export const STATUS_LABEL: Record<LearnStatus, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  mastered: 'Đã thuộc',
}

/** Nhãn đọc cho trình đọc màn hình, vd "Chữ あ, đọc là a, trạng thái: đang học". */
export function kanaAriaLabel(kana: Kana, status: LearnStatus): string {
  return `Chữ ${kana.char}, đọc là ${kana.romaji}, trạng thái: ${STATUS_LABEL[status].toLowerCase()}`
}

/**
 * Giải thích cấu tạo cho chữ không phải chữ cơ bản (không có mnemonic riêng).
 * Suy ra từ mã Unicode: が = か + 1, ぱ = は + 2 (cả Hiragana lẫn Katakana).
 */
export function compositionHint(kana: Kana): string | null {
  const chars = Array.from(kana.char)
  const cp = kana.char.codePointAt(0)!

  switch (kana.group) {
    case 'yoon':
      return `${kana.char} = ${chars[0]} + ${chars[1]} viết nhỏ → đọc liền thành một âm “${kana.romaji}”.`
    case 'dakuon': {
      const base = String.fromCodePoint(cp - 1)
      let hint = `${kana.char} = ${base} + dấu ゛(tenten) → âm đục “${kana.romaji}”.`
      // ぢ/づ đọc giống じ/ず
      const twin =
        kana.id === 'di'
          ? getKana(kana.script, 'ji')
          : kana.id === 'du'
            ? getKana(kana.script, 'zu')
            : undefined
      if (twin) hint += ` Đọc giống ${twin.char}, nhưng ít gặp hơn.`
      return hint
    }
    case 'handakuon':
      return `${kana.char} = ${String.fromCodePoint(cp - 2)} + dấu ゜(maru) → âm bán đục “${kana.romaji}”.`
    default:
      return null
  }
}
