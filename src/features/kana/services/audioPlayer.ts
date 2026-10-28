/**
 * Tầng phát âm thanh của phân hệ kana.
 *
 * Component KHÔNG gọi trực tiếp lớp nào ở đây mà chỉ đi qua hook useAudio → `audioPlayer`.
 * File âm thanh sinh bởi `npm run audio:build` (scripts/build-audio.ts, giọng VOICEVOX).
 */
import { getKana, toKatakana } from '@/data/kana'

export interface PlayOptions {
  /** Phát chậm để người mới nghe rõ. */
  slow?: boolean
}

export interface AudioPlayer {
  /** Phát âm của một chữ theo `Kana.id` (vd "ka", "shi", "kya"). Promise resolve khi phát xong hoặc bị stop(). */
  play(id: string, opts?: PlayOptions): Promise<void>
  /** Dừng âm đang phát (nếu có). */
  stop(): void
  /** Tải trước các âm sắp phát (vd cả hàng) để không bị khựng giữa chừng. */
  preload?(ids: readonly string[]): void
}

/**
 * Dự phòng bằng giọng đọc có sẵn của trình duyệt (Web Speech API, ja-JP).
 * Chất lượng tuỳ máy; máy không có giọng tiếng Nhật thì bỏ qua, không báo lỗi.
 */
export class SpeechAudioPlayer implements AudioPlayer {
  private finish: (() => void) | null = null

  play(id: string, opts: PlayOptions = {}): Promise<void> {
    this.stop()
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    const kana = getKana('hiragana', id)
    if (!synth || !kana) return Promise.resolve()

    // Đọc bằng Katakana để は/へ đứng một mình không bị đọc như trợ từ (wa/e).
    const utter = new SpeechSynthesisUtterance(toKatakana(kana.char))
    utter.lang = 'ja-JP'
    utter.rate = opts.slow ? 0.6 : 0.9
    const voice = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ja'))
    if (voice) utter.voice = voice

    return new Promise<void>((resolve) => {
      const done = () => {
        if (this.finish === done) this.finish = null
        resolve()
      }
      this.finish = done
      utter.onend = done
      utter.onerror = done
      synth.speak(utter)
    })
  }

  stop(): void {
    const finish = this.finish
    this.finish = null
    if (finish) window.speechSynthesis.cancel()
    finish?.()
  }
}

/**
 * Phát MP3 trong public/audio/<id>.mp3, bản chậm <id>.slow.mp3.
 * Hiragana và Katakana cùng âm dùng chung id nên dùng chung file.
 * - Mỗi file chỉ tạo một HTMLAudioElement rồi dùng lại → bấm lại không phải tải lại.
 * - Thiếu bản chậm: phát bản thường với playbackRate thấp hơn.
 * - Không tải được file: chuyển sang `fallback` (giọng trình duyệt).
 */
export class Mp3AudioPlayer implements AudioPlayer {
  private readonly baseUrl: string
  private readonly fallback: AudioPlayer | null
  private readonly cache = new Map<string, HTMLAudioElement>()
  /** URL đã lỗi → lần sau bỏ qua luôn, không thử lại. */
  private readonly broken = new Set<string>()
  private current: HTMLAudioElement | null = null
  private finish: (() => void) | null = null

  constructor(fallback: AudioPlayer | null = null, baseUrl = `${import.meta.env.BASE_URL}audio`) {
    this.fallback = fallback
    this.baseUrl = baseUrl
  }

  private url(id: string, slow: boolean) {
    return `${this.baseUrl}/${encodeURIComponent(id)}${slow ? '.slow' : ''}.mp3`
  }

  private element(url: string): HTMLAudioElement {
    let audio = this.cache.get(url)
    if (!audio) {
      audio = new Audio(url)
      audio.preload = 'auto'
      this.cache.set(url, audio)
    }
    return audio
  }

  preload(ids: readonly string[]): void {
    for (const id of ids) {
      const url = this.url(id, false)
      if (!this.broken.has(url)) this.element(url)
    }
  }

  async play(id: string, opts: PlayOptions = {}): Promise<void> {
    this.stop()
    const slowUrl = this.url(id, true)
    const normalUrl = this.url(id, false)

    if (opts.slow && !this.broken.has(slowUrl)) {
      const result = await this.playUrl(slowUrl, 1)
      if (result !== 'error') return
    }
    if (!this.broken.has(normalUrl)) {
      const result = await this.playUrl(normalUrl, opts.slow ? 0.7 : 1)
      if (result !== 'error') return
    }
    await this.fallback?.play(id, opts)
  }

  /** 'ended': phát xong hoặc bị stop() · 'error': không tải/giải mã được file. */
  private playUrl(url: string, rate: number): Promise<'ended' | 'error'> {
    const audio = this.element(url)
    audio.currentTime = 0
    audio.playbackRate = rate
    audio.preservesPitch = true
    this.current = audio

    return new Promise((resolve) => {
      let settled = false
      const cleanup = () => {
        settled = true
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
        if (this.current === audio) this.current = null
        if (this.finish === onEnded) this.finish = null
      }
      const onEnded = () => {
        if (settled) return
        cleanup()
        resolve('ended')
      }
      const onError = () => {
        if (settled) return
        cleanup()
        console.warn(`[audio] Không tải được ${url}`)
        this.broken.add(url)
        this.cache.delete(url)
        resolve('error')
      }
      this.finish = onEnded
      audio.addEventListener('ended', onEnded)
      audio.addEventListener('error', onError)
      audio.play().catch((err: unknown) => {
        // NotAllowedError: trình duyệt chặn autoplay · AbortError: bị stop() trước khi kịp phát.
        // Cả hai coi như phát xong để UI không bị treo; lỗi khác (vd NotSupportedError) → dự phòng.
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'AbortError') onEnded()
        else onError()
      })
    })
  }

  stop(): void {
    this.current?.pause()
    this.current = null
    const finish = this.finish
    this.finish = null
    finish?.()
    this.fallback?.stop()
  }
}

export const audioPlayer: AudioPlayer = new Mp3AudioPlayer(new SpeechAudioPlayer())
