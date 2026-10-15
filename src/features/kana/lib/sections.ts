/**
 * Ánh xạ dữ liệu bảng trong src/data/kana.ts sang mô hình hiển thị của các sub-tab.
 */
import {
  KANA_TABLES,
  VOWEL_COLS,
  YOON_COLS,
  type Kana,
  type KanaGroup,
  type KanaGrid,
  type Script,
} from '@/data/kana'

export type Section = 'basic' | 'voiced' | 'combo'

export const SCRIPTS: readonly { id: Script; label: string; native: string }[] = [
  { id: 'hiragana', label: 'Hiragana', native: 'ひらがな' },
  { id: 'katakana', label: 'Katakana', native: 'カタカナ' },
]

export const SECTIONS: readonly { id: Section; label: string; groups: readonly KanaGroup[] }[] = [
  { id: 'basic', label: 'Chữ cơ bản', groups: ['seion'] },
  { id: 'voiced', label: 'Âm đục & bán đục', groups: ['dakuon', 'handakuon'] },
  { id: 'combo', label: 'Âm ghép', groups: ['yoon'] },
]

export const GROUP_LABEL: Record<KanaGroup, string> = {
  seion: 'Chữ cơ bản',
  dakuon: 'Âm đục',
  handakuon: 'Âm bán đục',
  yoon: 'Âm ghép',
}

export function sectionOf(group: KanaGroup): Section {
  return SECTIONS.find((s) => s.groups.includes(group))!.id
}

export interface GridRow {
  key: string
  /** Nhãn hàng hiển thị bên trái (k, s, t...). */
  label: string
  cells: (Kana | null)[]
}

export interface GridModel {
  cols: readonly string[]
  rows: GridRow[]
}

/** Nhãn hàng: hàng nguyên âm không có phụ âm, hàng "nn" là ん. */
function rowLabel(grid: KanaGrid, i: number): string {
  const first = grid[i]?.find((k): k is Kana => k !== null)
  if (!first) return ''
  if (first.row === 'vowel') return '–'
  if (first.row === 'nn') return 'n'
  return first.row
}

function toRows(grid: KanaGrid): GridRow[] {
  return grid.map((cells, i) => ({
    key: cells.find((k) => k)?.row ?? String(i),
    label: rowLabel(grid, i),
    cells,
  }))
}

const modelCache = new Map<string, GridModel>()

export function getGridModel(script: Script, section: Section): GridModel {
  const cacheKey = `${script}:${section}`
  const cached = modelCache.get(cacheKey)
  if (cached) return cached

  const tables = KANA_TABLES[script]
  const model: GridModel =
    section === 'basic'
      ? { cols: VOWEL_COLS, rows: toRows(tables.seion) }
      : section === 'voiced'
        ? { cols: VOWEL_COLS, rows: [...toRows(tables.dakuon), ...toRows(tables.handakuon)] }
        : { cols: YOON_COLS, rows: toRows(tables.yoon) }

  modelCache.set(cacheKey, model)
  return model
}

/** Danh sách phẳng các chữ của một sub-tab, theo thứ tự bảng (dùng cho trước/sau, đếm tiến độ). */
export function getSectionKana(script: Script, section: Section): Kana[] {
  return getGridModel(script, section).rows.flatMap((r) => r.cells.filter((k): k is Kana => !!k))
}
