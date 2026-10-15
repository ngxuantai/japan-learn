/**
 * Tầng phát âm thanh của phân hệ kana.
 *
 * Component KHÔNG gọi trực tiếp lớp nào ở đây mà chỉ đi qua hook useAudio → `audioPlayer`.
 * Khi có file MP3: đổi dòng `export const audioPlayer = ...` ở cuối file sang Mp3AudioPlayer.
 * Không cần sửa component nào khác.
 */

export interface PlayOptions {
  /** Phát chậm để người mới nghe rõ. */
  slow?: boolean
}

export interface AudioPlayer {
  /** Phát âm của một chữ theo `Kana.id` (vd "ka", "shi", "kya"). Promise resolve khi phát xong hoặc bị stop(). */
  play(id: string, opts?: PlayOptions): Promise<void>
  /** Dừng âm đang phát (nếu có). */
  stop(): void
}

/**
 * Bản giả lập: chỉ console.log và giữ trạng thái "đang phát" khoảng 600ms (chậm: 1000ms).
 * Không bao giờ báo lỗi.
 */
export class DemoAudioPlayer implements AudioPlayer {
  private timer: ReturnType<typeof setTimeout> | null = null
  private finish: (() => void) | null = null

  play(id: string, opts: PlayOptions = {}): Promise<void> {
    this.stop()
    console.log(`[audio demo] ▶ ${id}${opts.slow ? ' (chậm)' : ''}`)
    return new Promise<void>((resolve) => {
      this.finish = resolve
      this.timer = setTimeout(
        () => {
          this.timer = null
          this.finish = null
          resolve()
        },
        opts.slow ? 1000 : 600,
      )
    })
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    const finish = this.finish
    this.finish = null
    finish?.()
  }
}

/**
 * Bản phát MP3 thật, dùng sẵn khi có file: public/audio/<id>.mp3 (vd public/audio/ka.mp3).
 * Hiragana và Katakana cùng âm dùng chung id nên dùng chung file.
 * Nghe chậm: phát cùng file với playbackRate thấp hơn, giữ nguyên cao độ.
 */
export class Mp3AudioPlayer implements AudioPlayer {
  private readonly baseUrl: string
  private readonly slowRate: number
  private audio: HTMLAudioElement | null = null
  private finish: (() => void) | null = null

  constructor(baseUrl = `${import.meta.env.BASE_URL}audio`, slowRate = 0.7) {
    this.baseUrl = baseUrl
    this.slowRate = slowRate
  }

  play(id: string, opts: PlayOptions = {}): Promise<void> {
    this.stop()
    const audio = new Audio(`${this.baseUrl}/${encodeURIComponent(id)}.mp3`)
    audio.playbackRate = opts.slow ? this.slowRate : 1
    audio.preservesPitch = true
    this.audio = audio

    return new Promise<void>((resolve) => {
      const done = () => {
        if (this.audio === audio) {
          this.audio = null
          this.finish = null
        }
        resolve()
      }
      this.finish = done
      audio.addEventListener('ended', done, { once: true })
      audio.addEventListener(
        'error',
        () => {
          console.warn(`[audio] Không tải được ${audio.src}`)
          done()
        },
        { once: true },
      )
      // Trình duyệt có thể chặn autoplay → coi như phát xong để UI không bị treo.
      audio.play().catch(done)
    })
  }

  stop(): void {
    this.audio?.pause()
    this.audio = null
    const finish = this.finish
    this.finish = null
    finish?.()
  }
}

// ↓↓↓ Khi có MP3: đổi thành `new Mp3AudioPlayer()` ↓↓↓
export const audioPlayer: AudioPlayer = new DemoAudioPlayer()

/** true khi đang dùng bản giả lập → UI hiện dòng "Âm thanh đang ở chế độ demo". */
export const AUDIO_IS_DEMO = audioPlayer instanceof DemoAudioPlayer
