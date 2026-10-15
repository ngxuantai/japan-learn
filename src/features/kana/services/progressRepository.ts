/**
 * Lưu tiến độ học. Component/store chỉ phụ thuộc interface ProgressRepository,
 * nên sau này thay bằng API/DB chỉ cần viết lớp mới và đổi `progressRepository` ở cuối file.
 */

export type LearnStatus = 'new' | 'learning' | 'mastered'

export interface ProgressRepository {
  /** Trả về map uid → trạng thái (uid dạng "hiragana:ka"). Chữ không có trong map = "new". */
  load(): Promise<Record<string, LearnStatus>>
  save(id: string, status: LearnStatus): Promise<void>
}

/** Lưu trong bộ nhớ: mất khi tải lại trang (không dùng localStorage/sessionStorage). */
export class InMemoryProgressRepository implements ProgressRepository {
  private readonly data = new Map<string, LearnStatus>()

  async load(): Promise<Record<string, LearnStatus>> {
    return Object.fromEntries(this.data)
  }

  async save(id: string, status: LearnStatus): Promise<void> {
    if (status === 'new') this.data.delete(id)
    else this.data.set(id, status)
  }
}

/*
 * Ví dụ bản API sau này:
 *
 * export class HttpProgressRepository implements ProgressRepository {
 *   async load() { return (await fetch('/api/kana-progress')).json() }
 *   async save(id: string, status: LearnStatus) {
 *     await fetch(`/api/kana-progress/${encodeURIComponent(id)}`, {
 *       method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
 *     })
 *   }
 * }
 */

export const progressRepository: ProgressRepository = new InMemoryProgressRepository()
