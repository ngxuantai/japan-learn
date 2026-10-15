import { Icon } from '@/shared/ui/Icon'
import { AUDIO_IS_DEMO } from '../services/audioPlayer'

/** Tự ẩn khi audioPlayer không còn là bản demo. Có thể xoá hẳn component này khi có MP3. */
export function AudioDemoNotice() {
  if (!AUDIO_IS_DEMO) return null
  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Icon name="speaker" className="h-3.5 w-3.5" />
      Âm thanh đang ở chế độ demo
    </p>
  )
}
