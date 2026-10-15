import { create } from 'zustand'

/** Trạng thái phát âm dùng chung cho mọi component (highlight ô đang đọc, nút đang phát...). */
interface AudioState {
  isPlaying: boolean
  /** uid của chữ đang phát. */
  currentUid: string | null
  isSlow: boolean
  /** Khoá của chuỗi đang "Phát cả hàng" (vd "hiragana:basic:k"), null nếu phát lẻ. */
  sequenceKey: string | null
}

export const IDLE_AUDIO: AudioState = {
  isPlaying: false,
  currentUid: null,
  isSlow: false,
  sequenceKey: null,
}

export const useAudioStore = create<AudioState>()(() => IDLE_AUDIO)
