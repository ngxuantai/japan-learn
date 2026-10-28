/**
 * Tạo file phát âm cho từng chữ kana bằng VOICEVOX → public/audio/<id>.mp3 và <id>.slow.mp3.
 *
 * Cách chạy:
 *   docker run --rm -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-0.25.2
 *   npm run audio:build             # chỉ tạo file còn thiếu
 *   npm run audio:build -- --force  # tạo lại tất cả
 *
 * Biến môi trường:
 *   VOICEVOX_URL      mặc định http://127.0.0.1:50021
 *   VOICEVOX_SPEAKER  tên giọng, dạng "<nhân vật>/<style>", mặc định "No.7/アナウンス"
 *
 * Hiragana và Katakana cùng âm dùng chung id nên dùng chung file.
 * Văn bản gửi cho TTS luôn là Katakana: tránh việc Open JTalk đọc は/へ đứng một mình
 * như trợ từ (wa/e).
 */
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Mp3Encoder } from '@breezystack/lamejs'
import { KANA, toKatakana, type Kana } from '../src/data/kana.ts'

const ENGINE = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021'
const SPEAKER = process.env.VOICEVOX_SPEAKER ?? 'No.7/アナウンス'
const OUT_DIR = path.resolve(import.meta.dirname, '../public/audio')
const FORCE = process.argv.includes('--force')

const SAMPLE_RATE = 24000
const BITRATE_KBPS = 48
/** Tốc độ bản "nghe chậm". */
const SLOW_SPEED = 0.7
/** Mục tiêu chuẩn hoá âm lượng (dBFS). */
const TARGET_RMS_DB = -18
const MAX_PEAK_DB = -1

/** Âm mà Open JTalk đọc khác chữ viết (cách đọc chuẩn hiện đại). */
const EXPECTED_READING: Record<string, string> = { ヂ: 'ジ', ヅ: 'ズ', ヲ: 'オ' }

interface Mora {
  text: string
}
interface AudioQuery {
  accent_phrases: { moras: Mora[] }[]
  speedScale: number
  prePhonemeLength: number
  postPhonemeLength: number
  outputSamplingRate: number
  outputStereo: boolean
  [key: string]: unknown
}

async function api<T>(pathname: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE}${pathname}`, init)
  if (!res.ok)
    throw new Error(`${init?.method ?? 'GET'} ${pathname} → ${res.status} ${await res.text()}`)
  return (res.headers.get('content-type')?.includes('json') ? res.json() : res.arrayBuffer()) as T
}

async function findSpeakerId(): Promise<number> {
  const [name, styleName] = SPEAKER.split('/')
  const speakers =
    await api<{ name: string; styles: { name: string; id: number }[] }[]>('/speakers')
  const style = speakers
    .find((s) => s.name === name)
    ?.styles.find((st) => !styleName || st.name === styleName)
  if (!style) {
    const all = speakers.flatMap((s) => s.styles.map((st) => `${s.name}/${st.name}`))
    throw new Error(`Không tìm thấy giọng "${SPEAKER}". Có: ${all.join(', ')}`)
  }
  return style.id
}

/** Lấy mẫu PCM 16-bit mono từ file WAV do VOICEVOX trả về. */
function readWavPcm(buf: ArrayBuffer): Int16Array {
  const view = new DataView(buf)
  let offset = 12
  let format: { channels: number; bits: number; rate: number } | null = null
  while (offset + 8 <= view.byteLength) {
    const id = String.fromCharCode(...new Uint8Array(buf, offset, 4))
    const size = view.getUint32(offset + 4, true)
    const body = offset + 8
    if (id === 'fmt ') {
      format = {
        channels: view.getUint16(body + 2, true),
        rate: view.getUint32(body + 4, true),
        bits: view.getUint16(body + 14, true),
      }
    } else if (id === 'data') {
      if (!format || format.channels !== 1 || format.bits !== 16 || format.rate !== SAMPLE_RATE) {
        throw new Error(`WAV không đúng định dạng mong đợi: ${JSON.stringify(format)}`)
      }
      return new Int16Array(buf.slice(body, body + size))
    }
    offset = body + size + (size % 2)
  }
  throw new Error('WAV không có chunk data')
}

/** Đưa về cùng độ to (RMS), không để đỉnh vượt MAX_PEAK_DB. */
function normalize(pcm: Int16Array): Int16Array {
  let sumSq = 0
  let peak = 0
  for (const s of pcm) {
    sumSq += s * s
    peak = Math.max(peak, Math.abs(s))
  }
  if (peak === 0) return pcm
  const rms = Math.sqrt(sumSq / pcm.length) / 32768
  const gainRms = 10 ** (TARGET_RMS_DB / 20) / rms
  const gainPeak = 10 ** (MAX_PEAK_DB / 20) / (peak / 32768)
  const gain = Math.min(gainRms, gainPeak)
  return pcm.map((s) => Math.max(-32768, Math.min(32767, Math.round(s * gain))))
}

function encodeMp3(pcm: Int16Array): Uint8Array {
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, BITRATE_KBPS)
  // lamejs thực tế trả về Int8Array (khác type.d.ts) → bọc lại thành Uint8Array cùng vùng nhớ.
  const bytes = (chunk: ArrayBufferView) =>
    new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  const chunks: Uint8Array[] = []
  for (let i = 0; i < pcm.length; i += 1152) {
    chunks.push(bytes(encoder.encodeBuffer(pcm.subarray(i, i + 1152))))
  }
  chunks.push(bytes(encoder.flush()))
  return Buffer.concat(chunks)
}

async function synthesize(speaker: number, text: string, speed: number): Promise<Uint8Array> {
  const query = await api<AudioQuery>(
    `/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`,
    { method: 'POST' },
  )
  const reading = query.accent_phrases.flatMap((p) => p.moras.map((m) => m.text)).join('')
  const expected = EXPECTED_READING[text] ?? text
  if (reading !== expected)
    throw new Error(`"${text}" bị đọc thành "${reading}" (mong đợi "${expected}")`)

  Object.assign(query, {
    speedScale: speed,
    prePhonemeLength: 0.05,
    postPhonemeLength: 0.15,
    outputSamplingRate: SAMPLE_RATE,
    outputStereo: false,
  })
  const wav = await api<ArrayBuffer>(`/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(query),
  })
  return encodeMp3(normalize(readWavPcm(wav)))
}

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  )

async function main() {
  const version = await api<string>('/version').catch(() => {
    throw new Error(
      `Không kết nối được VOICEVOX ở ${ENGINE}. Hãy chạy engine trước (xem đầu file).`,
    )
  })
  const speaker = await findSpeakerId()
  console.log(`VOICEVOX ${version} · giọng ${SPEAKER} (id ${speaker})`)

  const unique = [...new Map<string, Kana>(KANA.map((k) => [k.id, k])).values()]
  await mkdir(OUT_DIR, { recursive: true })

  let made = 0
  const failed: string[] = []
  for (const kana of unique) {
    const text = toKatakana(kana.char)
    for (const [suffix, speed] of [
      ['', 1],
      ['.slow', SLOW_SPEED],
    ] as const) {
      const file = path.join(OUT_DIR, `${kana.id}${suffix}.mp3`)
      if (!FORCE && (await exists(file))) continue
      try {
        await writeFile(file, await synthesize(speaker, text, speed))
        made++
      } catch (err) {
        failed.push(`${kana.id}${suffix}: ${(err as Error).message}`)
      }
    }
  }

  console.log(
    `Đã tạo ${made} file trong ${path.relative(process.cwd(), OUT_DIR)} (${unique.length} âm).`,
  )
  if (failed.length) {
    console.error(`Lỗi ${failed.length} file:\n  ${failed.join('\n  ')}`)
    process.exitCode = 1
  }
}

await main()
