import { useCallback, useEffect } from 'react'
import type { Kana } from '@/data/kana'
import type { LearnStatus } from '../services/progressRepository'
import { useKanaStore } from '../store/kanaStore'

/** Tiến độ học: tự tải từ ProgressRepository ở lần dùng đầu tiên. */
export function useKanaProgress() {
  const progress = useKanaStore((s) => s.progress)
  const progressState = useKanaStore((s) => s.progressState)
  const loadProgress = useKanaStore((s) => s.loadProgress)
  const setStatus = useKanaStore((s) => s.setStatus)

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  const statusOf = useCallback((uid: string): LearnStatus => progress[uid] ?? 'new', [progress])
  const countMastered = useCallback(
    (list: readonly Kana[]) => list.filter((k) => progress[k.uid] === 'mastered').length,
    [progress],
  )

  return { progress, isLoaded: progressState === 'ready', statusOf, setStatus, countMastered }
}

/** Selector cho một ô. */
export function useKanaStatus(uid: string): LearnStatus {
  return useKanaStore((s) => s.progress[uid] ?? 'new')
}
