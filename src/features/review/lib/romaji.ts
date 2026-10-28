/**
 * Chấm câu trả lời romaji. Chấp nhận Hepburn (cách hiển thị trong app) và các cách gõ
 * Kunrei / Nihon-shiki / kiểu IME phổ biến, để người học không bị tính sai vì khác hệ phiên âm.
 */
import type { Kana } from '@/data/kana'

/** Cách viết khác được chấp nhận, theo `Kana.id`. */
const VARIANTS: Readonly<Record<string, readonly string[]>> = {
  shi: ['si'],
  chi: ['ti'],
  tsu: ['tu'],
  fu: ['hu'],
  ji: ['zi'],
  // ぢ/づ đọc như じ/ず.
  di: ['ji', 'zi'],
  du: ['zu', 'dzu'],
  // を thường đọc là "o".
  wo: ['o'],
  n: ['nn', "n'"],
  sha: ['sya'],
  shu: ['syu'],
  sho: ['syo'],
  cha: ['tya', 'cya'],
  chu: ['tyu', 'cyu'],
  cho: ['tyo', 'cyo'],
  ja: ['zya', 'jya'],
  ju: ['zyu', 'jyu'],
  jo: ['zyo', 'jyo'],
}

export function normalizeRomaji(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '')
}

export function acceptedRomaji(kana: Kana): ReadonlySet<string> {
  return new Set([kana.romaji, kana.id, ...(VARIANTS[kana.id] ?? [])])
}

export function isCorrectRomaji(kana: Kana, input: string): boolean {
  return acceptedRomaji(kana).has(normalizeRomaji(input))
}

/**
 * Gợi ý kèm romaji khi hỏi viết chữ, cho các âm đọc trùng nhau
 * (じ/ぢ cùng "ji", ず/づ cùng "zu") để câu hỏi không mơ hồ.
 */
const WRITING_HINT: Readonly<Record<string, string>> = {
  ji: 'hàng z',
  zu: 'hàng z',
  di: 'hàng d',
  du: 'hàng d',
}

export function writingHint(kana: Kana): string | null {
  return WRITING_HINT[kana.id] ?? null
}
