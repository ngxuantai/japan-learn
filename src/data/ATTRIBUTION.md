# Ghi nguồn / Attribution

## Dữ liệu nét vẽ — `strokes.json`

Dữ liệu nét vẽ Hiragana và Katakana trong `src/data/strokes.json` được trích xuất từ
**KanjiVG**.

- Dự án: KanjiVG — <https://kanjivg.tagaini.net>
- Mã nguồn: <https://github.com/KanjiVG/kanjivg>
- Tác giả: Copyright (C) 2009–2024 Ulrich Apel và các cộng tác viên của KanjiVG
- Giấy phép: [Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/)

### Những thay đổi so với bản gốc

`scripts/build-strokes.ts` đã biến đổi dữ liệu gốc như sau:

- Chỉ lấy các ký tự trong dải U+3041–U+3096 (Hiragana) và U+30A1–U+30F6 (Katakana).
- Chỉ giữ thuộc tính `d` của các phần tử `<path>` theo nét (`kvg:XXXXX-sN`) và `viewBox`;
  bỏ các nhóm, metadata và số thứ tự nét gốc.
- Thêm dữ liệu tính toán: điểm bắt đầu của từng nét (`start`) và tổng chiều dài path (`length`).
- Chuyển sang định dạng JSON.

### Share-Alike

Vì `strokes.json` là tác phẩm phái sinh từ KanjiVG, file này **cũng được phân phối theo
giấy phép CC BY-SA 3.0**. Ai sử dụng lại file này phải ghi nguồn KanjiVG như trên và giữ
nguyên giấy phép tương tự.

Giấy phép này chỉ áp dụng cho dữ liệu nét vẽ, không áp dụng cho mã nguồn của website.

---

## Dữ liệu chữ cái, mẹo nhớ, từ ví dụ

`kana.ts`, `mnemonics.vi.ts`, `examples.ts` là nội dung do dự án tự biên soạn, không lấy
từ KanjiVG.

---

## Gợi ý hiển thị trên website

Đặt ở chân trang hoặc trang “Giới thiệu / Nguồn dữ liệu”:

> Dữ liệu nét vẽ từ [KanjiVG](https://kanjivg.tagaini.net) © Ulrich Apel,
> theo giấy phép [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
