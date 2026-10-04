# PLAN — Game "Phở Đi!" 🍜

## 1. Tổng quan
Game quản lý quán phở 2D mobile (portrait), clone cơ chế Bánh cuốn nhưng:
- Đề tài Phở (thay vì Bánh cuốn)
- **Khách feedback sau khi ăn** (feature mới Tony yêu cầu)
- **Hình ảnh đẹp hơn** (Tony yêu cầu)

Tech stack: Vanilla JS + ES modules, host **GitHub Pages**.

## 2. Gameplay Loop
```
Màn Bắt đầu → Chuẩn bị (minigame) → Quầy bán → Hết ngày → Ngày mới
→ Sập tiệm (tiền âm) → Chơi lại
```

## 3. Các bước phục vụ (8 bước, theo số tô)
| # | Bước | Thao tác |
|---|------|----------|
| 1 | Trụng bánh | Chạm nồi nước sôi, chờ bánh mềm |
| 2 | Cho vào tô | Chạm tô trống |
| 3 | Chan nước dùng | Chạm nồi nước dùng |
| 4 | Thịt | Chạm khay thịt theo món (bò tái/chín, gà) |
| 5 | Hành ngò | Chạm khay hành |
| 6 | Topping | Chạm khay topping theo order (quẩy, trứng, giá...) — **chỗ duy nhất có thể sai** |
| 7 | Rau thơm | Chạm khay rau |
| 8 | Bưng ra | Chạm khay → giao khách |

## 4. Hệ thống

### Tiền tệ
- **Vốn ban đầu:** 500k
- **Thu:** bán đúng món (30k-50k/tô), tip khách 5★ (+5-10k), thưởng đạt target (+50k)
- **Chi:** nguyên liệu 150k/ngày, mặt bằng 200k/ngày (từ ngày 3), sự cố (50k-1tr)
- **Target ngày:** 300k (ngày 1), +100k mỗi ngày
- **Sập tiệm:** tiền < 0 → chơi lại

### Sao / Rating (0-5, bắt đầu 3★)
- Giao đúng + ngon: +1★ | Giao sai/khách bỏ đi: -1★
- Sao ảnh hưởng lượng khách: <3★ giảm một nửa, >3★ mỗi sao +10%

### Thời gian
- 6:00-21:00, giờ cao điểm (7-11h, 18-20h) ×2 khách

### Khách hàng
- Lẻ: 100s kiên nhẫn, 1 suất
- Shipper app: ưu tiên, 1-3 suất, từ ngày 2

## 5. Feature mới: Feedback khách hàng ⭐
Sau khi giao món 3-5 giây, hiện bong bóng chat:
- Ngon: "Nước dùng ngọt thanh quá!", "Thịt bò mềm tuyệt!"
- Dở: "Phở nguội rồi!", "Nước lèo nhạt quá!"
- Chậm: "Chờ lâu quá đi!"
- Feedback ảnh hưởng sao trực tiếp, có animation mặt cười/mếu

## 6. Menu món ăn
**Ngày 1:** Phở bò tái (35k), Phở bò chín (35k), Phở gà (30k)
**Ngày 3:** Phở tái nạm (40k), Phở gà đùi (35k)
**Ngày 4:** Trà đá (3k), Nước ngọt (10k)
**Ngày 5:** Phở đặc biệt (50k), Phở bò viên (35k)
**Topping:** Quẩy (5k), Trứng chần (7k), Giá (3k), Thêm thịt (15k), Thêm bánh (5k)

## 7. Mở khóa tính năng
| Tính năng | Điều kiện |
|-----------|-----------|
| Đơn app | Qua ngày 1 |
| Phở tái nạm, gà đùi | Ngày 3 + sao ≥ 3★ |
| Đồ uống | Ngày 4 + bán 50 tô |
| Phở đặc biệt | Ngày 5 + doanh thu 1 ngày ≥ 500k |
| Topping cao cấp | Sao đạt 4★ |
| Quán đông (4 khách) | Ngày 7 + sao ≥ 4★ |

## 8. Huy hiệu 🏅
- 🔥 "Tay nghề cao" — 10 tô liên tiếp không sai (+50k)
- ⚡ "Thần tốc" — phục vụ trong 30s (+50k)
- 🎯 "Chuẩn vị" — 50 tô đúng topping (+50k)
- 💰 "Triệu phú" — cán mốc 1tr (+100k)
- 🌟 "5 sao" — đạt 5★ (+100k)
- 🍜 "Vua phở" — bán 500 tô (+200k)

## 9. Thử thách 📋
**Hàng ngày** (3 cái, chọn làm):
- "20 tô trước 10h" — thưởng 30k
- "Không khách nào bỏ đi" — thưởng 40k
- "5 tô đặc biệt" — thưởng 50k
**Hàng tuần:**
- "5★ 3 ngày liên tiếp" — thưởng 200k
- "3 triệu/tuần" — thưởng 150k

## 10. Rủi ro ⚠️
**Trong lúc bán** (từ ngày 2, tăng 10%/ngày):
- Bom hàng, shipper đổ/trộm, QR giả
- **Hết nước dùng** (đặc thù Phở!), khách chê nhạt, nhầm tô bò/gà
**Đời sống** (từ ngày 5): hết ga, thịt ôi, phạt VSATTP, tăng tiền thuê

## 11. Chuẩn visual "đẹp hơn Bánh cuốn"
- Art AI gen chất lượng cao hơn: chi tiết, màu ấm, nhất quán style
- Animation: khói bốc từ tô phở, khách cười, sao bay
- UI chỉn chu: font đẹp, nút bấm có hiệu ứng

## 7. Task breakdown (trình anh duyệt từng đợt)

### Đợt 1: Khung game
- 1.1 Setup project (HTML, CSS, manifest, config.json)
- 1.2 Màn Bắt đầu + Intro
- 1.3 Hệ thống âm thanh

### Đợt 2: Quầy bán chính
- 2.1 Scene quầy (background + hotspot)
- 2.2 8 bước phục vụ (tapflow)
- 2.3 Khách hàng + hàng đợi
- 2.4 Tiền + sao + đồng hồ

### Đợt 3: Hệ thống nâng cao
- 3.1 Giờ cao điểm + sự cố + rủi ro
- 3.2 Đơn app + shipper
- 3.3 **Feedback khách hàng** ⭐
- 3.4 Huy hiệu + Thử thách
- 3.5 Save/load

### Đợt 4: Chuẩn bị + hoàn thiện
- 4.1 Minigame chuẩn bị (ninh xương, thái thịt, rửa rau, pha mắm)
- 4.2 Menu unlock + điều kiện mở khóa
- 4.3 Polish visual + animation (chuẩn "đẹp hơn Bánh cuốn")
- 4.4 Test + deploy GitHub Pages

## 8. Asset cần (AI gen)
- Background quầy phở
- Sprite: tô phở, bánh phở, thịt bò/gà, hành ngò, rau thơm, quẩy, trứng
- Khách hàng (3-4 kiểu)
- UI: nút, sao, tiền, đồng hồ

---
**Anh duyệt plan này thì em bắt đầu Đợt 1.**
