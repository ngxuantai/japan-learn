/**
 * State của phân hệ kana (Zustand).
 *
 * Lý do chọn Zustand:
 * - Không cần Provider, store gọn trong một file, action gọi được cả ngoài React (vd callback âm thanh).
 * - Component subscribe bằng selector → khi đổi trạng thái 1 chữ, chỉ ô đó render lại
 *   thay vì cả lưới 46–66 ô như khi dùng Context.
 * - Nhẹ (~1KB), API đơn giản hơn Redux cho một phân hệ nhỏ.
 */
import { create } from 'zustand'
import { KANA_BY_UID, type Script } from '@/data/kana'
import { getSectionKana, sectionOf, type Section } from '../lib/sections'
import { progressRepository, type LearnStatus } from '../services/progressRepository'

export type DetailTab = 'stroke' | 'practice'

interface KanaState {
  script: Script
  section: Section
  /** uid của chữ đang chọn, vd "hiragana:ka". */
  selectedUid: string | null
  showRomaji: boolean
  detailTab: DetailTab
  progress: Record<string, LearnStatus>
  progressState: 'idle' | 'loading' | 'ready' | 'error'

  setScript(script: Script): void
  setSection(section: Section): void
  select(uid: string | null): void
  /** Chọn chữ trước (-1) / sau (+1) trong cùng sub-tab của chữ đang chọn. */
  selectAdjacent(delta: -1 | 1): void
  toggleRomaji(): void
  setDetailTab(tab: DetailTab): void
  loadProgress(): Promise<void>
  setStatus(uid: string, status: LearnStatus): Promise<void>
}

export const useKanaStore = create<KanaState>()((set, get) => ({
  script: 'hiragana',
  section: 'basic',
  selectedUid: null,
  showRomaji: true,
  detailTab: 'stroke',
  progress: {},
  progressState: 'idle',

  setScript: (script) =>
    set((s) => {
      // Đổi Hiragana ↔ Katakana: giữ chữ cùng âm đang chọn (か → カ).
      const current = s.selectedUid ? KANA_BY_UID.get(s.selectedUid) : undefined
      const twin = current ? `${script}:${current.id}` : null
      return { script, selectedUid: twin && KANA_BY_UID.has(twin) ? twin : null }
    }),

  setSection: (section) => set({ section }),

  select: (uid) => set({ selectedUid: uid }),

  selectAdjacent: (delta) => {
    const current = get().selectedUid ? KANA_BY_UID.get(get().selectedUid!) : undefined
    if (!current) return
    const list = getSectionKana(current.script, sectionOf(current.group))
    const next = list[list.findIndex((k) => k.uid === current.uid) + delta]
    if (next) set({ selectedUid: next.uid })
  },

  toggleRomaji: () => set((s) => ({ showRomaji: !s.showRomaji })),

  setDetailTab: (detailTab) => set({ detailTab }),

  loadProgress: async () => {
    if (get().progressState !== 'idle') return
    set({ progressState: 'loading' })
    try {
      const progress = await progressRepository.load()
      set((s) => ({ progress: { ...progress, ...s.progress }, progressState: 'ready' }))
    } catch (err) {
      console.error('Không tải được tiến độ học', err)
      set({ progressState: 'error' })
    }
  },

  setStatus: async (uid, status) => {
    const previous = get().progress[uid]
    // Cập nhật lạc quan, hoàn tác nếu lưu thất bại.
    set((s) => ({ progress: { ...s.progress, [uid]: status } }))
    try {
      await progressRepository.save(uid, status)
    } catch (err) {
      console.error('Không lưu được tiến độ', err)
      set((s) => {
        const progress = { ...s.progress }
        if (previous) progress[uid] = previous
        else delete progress[uid]
        return { progress }
      })
    }
  },
}))
