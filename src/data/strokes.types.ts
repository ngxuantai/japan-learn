/** Kiểu dữ liệu của src/data/strokes.json (sinh bởi scripts/build-strokes.ts). */

export interface Stroke {
  /** Số thứ tự nét, bắt đầu từ 1. */
  index: number;
  /** Thuộc tính `d` của <path> lấy nguyên từ KanjiVG. */
  d: string;
  /** Điểm bắt đầu nét [x, y] trong hệ toạ độ viewBox — dùng để đặt số thứ tự nét. */
  start: [number, number];
  /** Tổng chiều dài path — dùng cho stroke-dasharray / stroke-dashoffset khi animate. */
  length: number;
}

export interface StrokeData {
  /** Mã Unicode hex 4 chữ số, chữ thường (vd: "3042", "30a2"). */
  unicode: string;
  viewBox: string;
  strokes: Stroke[];
}

/** Key là chính ký tự, vd "あ". */
export type StrokesFile = Record<string, StrokeData>;
