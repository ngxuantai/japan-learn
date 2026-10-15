/**
 * Dữ liệu bảng chữ cái Hiragana & Katakana.
 *
 * - Bảng bố cục được khai báo một lần bằng Hiragana; Katakana sinh tự động bằng cách
 *   cộng 0x60 vào mã Unicode (あ U+3042 → ア U+30A2), nên hai bảng luôn khớp nhau.
 * - Mnemonic và từ ví dụ nằm ở file riêng (mnemonics.vi.ts, examples.ts) để dễ chỉnh/dịch.
 */
import { MNEMONICS_VI } from "./mnemonics.vi.ts";
import { EXAMPLES } from "./examples.ts";

// ===================== Types =====================

export type Script = "hiragana" | "katakana";
export type KanaGroup = "seion" | "dakuon" | "handakuon" | "yoon";

/** Cột của bảng 50 âm. */
export const VOWEL_COLS = ["a", "i", "u", "e", "o"] as const;
/** Cột của bảng âm ghép. */
export const YOON_COLS = ["ya", "yu", "yo"] as const;
export type VowelCol = (typeof VOWEL_COLS)[number];
export type YoonCol = (typeof YOON_COLS)[number];
export type KanaCol = VowelCol | YoonCol;

/** Hàng của bảng 50 âm. "nn" là hàng riêng của ん (để không trùng với hàng "n" của な). */
export const SEION_ROWS = ["vowel", "k", "s", "t", "n", "h", "m", "y", "r", "w", "nn"] as const;
export const DAKUON_ROWS = ["g", "z", "d", "b"] as const;
export const HANDAKUON_ROWS = ["p"] as const;
export const YOON_ROWS = ["k", "s", "t", "n", "h", "m", "r", "g", "z", "b", "p"] as const;
export type KanaRow =
  | (typeof SEION_ROWS)[number]
  | (typeof DAKUON_ROWS)[number]
  | (typeof HANDAKUON_ROWS)[number]
  | (typeof YOON_ROWS)[number];

export interface KanaExample {
  /** Từ viết bằng kana, vd "ねこ". */
  kana: string;
  /** Romaji Hepburn; trường âm viết bằng nguyên âm đôi (コーヒー → koohii) để dễ gõ. */
  romaji: string;
  meaningVi: string;
}

export interface Kana {
  /**
   * Id ổn định theo âm đọc, dùng để gắn file âm thanh (vd "ka", "shi", "kya").
   * Hiragana và Katakana cùng âm có cùng id → dùng chung file âm thanh.
   * Duy nhất trong mỗi script; các âm trùng cách đọc dùng id riêng: ぢ = "di", づ = "du".
   */
  id: string;
  /** Khoá duy nhất toàn cục: `${script}:${id}`, vd "katakana:ka". */
  uid: string;
  char: string;
  script: Script;
  /** Romaji hiển thị (Hepburn). */
  romaji: string;
  group: KanaGroup;
  row: KanaRow;
  col: KanaCol;
  mnemonic?: string;
  examples?: KanaExample[];
}

// ===================== Bố cục bảng (khai báo bằng Hiragana) =====================

/** [chữ hiragana, id, romaji (nếu khác id)] hoặc null cho ô trống. */
type Cell = readonly [hira: string, id: string, romaji?: string] | null;

const SEION_LAYOUT: Record<(typeof SEION_ROWS)[number], readonly Cell[]> = {
  vowel: [["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"]],
  k: [["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"]],
  s: [["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"]],
  t: [["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"]],
  n: [["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"]],
  h: [["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"]],
  m: [["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"]],
  y: [["や", "ya"], null, ["ゆ", "yu"], null, ["よ", "yo"]], // không có yi, ye
  r: [["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"]],
  w: [["わ", "wa"], null, null, null, ["を", "wo"]], // ゐ ゑ đã cổ, không dạy; không có wu
  nn: [["ん", "n"], null, null, null, null],
};

const DAKUON_LAYOUT: Record<(typeof DAKUON_ROWS)[number], readonly Cell[]> = {
  g: [["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"]],
  z: [["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"]],
  d: [["だ", "da"], ["ぢ", "di", "ji"], ["づ", "du", "zu"], ["で", "de"], ["ど", "do"]],
  b: [["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"]],
};

const HANDAKUON_LAYOUT: Record<(typeof HANDAKUON_ROWS)[number], readonly Cell[]> = {
  p: [["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]],
};

const YOON_LAYOUT: Record<(typeof YOON_ROWS)[number], readonly Cell[]> = {
  k: [["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"]],
  s: [["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"]],
  t: [["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"]],
  n: [["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"]],
  h: [["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"]],
  m: [["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"]],
  r: [["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"]],
  g: [["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"]],
  z: [["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"]],
  b: [["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"]],
  p: [["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"]],
};

// ===================== Sinh dữ liệu =====================

/** Hiragana → Katakana: dịch mã Unicode +0x60 cho từng ký tự trong dải U+3041–U+3096. */
export function toKatakana(hira: string): string {
  return Array.from(hira, (c) => {
    const cp = c.codePointAt(0)!;
    return cp >= 0x3041 && cp <= 0x3096 ? String.fromCodePoint(cp + 0x60) : c;
  }).join("");
}

export type KanaGrid = (Kana | null)[][];

function buildGrid<R extends string>(
  script: Script,
  group: KanaGroup,
  layout: Record<R, readonly Cell[]>,
  rows: readonly R[],
  cols: readonly KanaCol[],
): KanaGrid {
  return rows.map((row) =>
    layout[row].map((cell, i): Kana | null => {
      if (!cell) return null;
      const [hira, id, romaji] = cell;
      const char = script === "hiragana" ? hira : toKatakana(hira);
      const extras = group === "seion" ? { mnemonic: MNEMONICS_VI[char], examples: EXAMPLES[char] } : {};
      return {
        id,
        uid: `${script}:${id}`,
        char,
        script,
        romaji: romaji ?? id,
        group,
        row: row as KanaRow,
        col: cols[i]!,
        // Chỉ chữ cơ bản (seion) có mnemonic/ví dụ; dùng spread để không sinh key undefined.
        ...(extras.mnemonic ? { mnemonic: extras.mnemonic } : {}),
        ...(extras.examples ? { examples: [...extras.examples] } : {}),
      };
    }),
  );
}

function buildTables(script: Script) {
  return {
    /** 11 hàng × 5 cột (a i u e o), ô null là vị trí không tồn tại. */
    seion: buildGrid(script, "seion", SEION_LAYOUT, SEION_ROWS, VOWEL_COLS),
    /** 4 hàng (g z d b) × 5 cột. */
    dakuon: buildGrid(script, "dakuon", DAKUON_LAYOUT, DAKUON_ROWS, VOWEL_COLS),
    /** 1 hàng (p) × 5 cột. */
    handakuon: buildGrid(script, "handakuon", HANDAKUON_LAYOUT, HANDAKUON_ROWS, VOWEL_COLS),
    /** 11 hàng × 3 cột (ya yu yo). */
    yoon: buildGrid(script, "yoon", YOON_LAYOUT, YOON_ROWS, YOON_COLS),
  } satisfies Record<KanaGroup, KanaGrid>;
}

/** Bảng theo bố cục để render UI: KANA_TABLES.hiragana.seion[hàng][cột]. */
export const KANA_TABLES: Record<Script, Record<KanaGroup, KanaGrid>> = {
  hiragana: buildTables("hiragana"),
  katakana: buildTables("katakana"),
};

/** Danh sách phẳng tất cả chữ (bỏ ô trống), theo thứ tự bảng. */
export const KANA: readonly Kana[] = (["hiragana", "katakana"] as const).flatMap((script) =>
  (["seion", "dakuon", "handakuon", "yoon"] as const).flatMap((group) =>
    KANA_TABLES[script][group].flat().filter((k): k is Kana => k !== null),
  ),
);

export const KANA_BY_CHAR: ReadonlyMap<string, Kana> = new Map(KANA.map((k) => [k.char, k]));
export const KANA_BY_UID: ReadonlyMap<string, Kana> = new Map(KANA.map((k) => [k.uid, k]));

export function getKana(script: Script, id: string): Kana | undefined {
  return KANA_BY_UID.get(`${script}:${id}`);
}
