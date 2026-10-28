import { useShallow } from 'zustand/react/shallow'
import type { Kana } from '@/data/kana'
import { audioPlayer } from '../services/audioPlayer'
import { IDLE_AUDIO, useAudioStore } from '../store/audioStore'

/** Khoảng nghỉ giữa các chữ khi phát cả hàng. */
const SEQUENCE_GAP_MS = 180

/**
 * Mỗi lần phát mới tăng token. Lượt phát cũ thấy token đã đổi thì tự dừng →
 * không bao giờ phát chồng, kể cả giữa nhiều component.
 */
let token = 0
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function play(kana: Kana, opts: { slow?: boolean } = {}) {
  const mine = ++token
  audioPlayer.stop()
  useAudioStore.setState({
    isPlaying: true,
    currentUid: kana.uid,
    isSlow: !!opts.slow,
    sequenceKey: null,
  })
  try {
    await audioPlayer.play(kana.id, opts)
  } finally {
    if (mine === token) useAudioStore.setState(IDLE_AUDIO)
  }
}

async function playSequence(list: Kana[], key: string) {
  const mine = ++token
  audioPlayer.stop()
  audioPlayer.preload?.(list.map((k) => k.id))
  for (const kana of list) {
    if (mine !== token) return
    useAudioStore.setState({
      isPlaying: true,
      currentUid: kana.uid,
      isSlow: false,
      sequenceKey: key,
    })
    await audioPlayer.play(kana.id)
    if (mine !== token) return
    await sleep(SEQUENCE_GAP_MS)
  }
  if (mine === token) useAudioStore.setState(IDLE_AUDIO)
}

function stop() {
  token++
  audioPlayer.stop()
  useAudioStore.setState(IDLE_AUDIO)
}

export function useAudio() {
  const state = useAudioStore(useShallow((s) => s))
  return { ...state, play, playSequence, stop }
}

/** Selector nhẹ cho từng ô: chỉ render lại ô vừa bắt đầu / kết thúc phát. */
export function useIsPlaying(uid: string) {
  return useAudioStore((s) => s.currentUid === uid)
}
