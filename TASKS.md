# TASK CHI TIẾT — Game "Phở Đi!" 🍜

## ĐỢT 1: Khung game

### 1.1 Setup project
**Mục tiêu:** Project chạy được, hiện màn hình cơ bản

**Chi tiết:**
- [ ] Tạo index.html: viewport mobile, title "Phở Đi!", font Baloo 2 + Nunito
- [ ] Tạo manifest.webmanifest: name, icons, theme-color #a83232, portrait
- [ ] Tạo styles.css: reset, layout 430×920, CSS var --s cho scale
- [ ] Tạo portrait.css: media query màn dọc
- [ ] Tạo src/config.json: startMoney, hours, dishes cơ bản
- [ ] Tạo src/main.js: load config, hiện "Phở Đi!" giữa màn hình

**Test:** Mở index.html → thấy chữ "Phở Đi!" + không lỗi console

---

### 1.2 Màn Bắt đầu + Intro
**Mục tiêu:** Người chơi bấm bắt đầu vào được game

**Chi tiết:**
- [ ] AI gen ảnh: quầy phở đẹp (background màn bắt đầu)
- [ ] scenes/intro.js: render ảnh + tiêu đề + nút "Bắt đầu chơi"
- [ ] Nút có hiệu ứng hover/active
- [ ] Bấm nút → chuyển sang màn chuẩn bị (tạm thời alert)

**Test:** Bấm "Bắt đầu chơi" → chuyển màn, không lỗi

---

### 1.3 Hệ thống âm thanh
**Mục tiêu:** Có nhạc nền + tiếng động

**Chi tiết:**
- [ ] audio.js: Web Audio API wrapper
- [ ] Hàm playMusic(url, loop), playSfx(url), setVolume
- [ ] Nút bật/tắt nhạc + sfx riêng (lưu localStorage)
- [ ] Unlock audio ở lần chạm đầu (fix iOS)
- [ ] Tạm dùng: 1 file nhạc nền + 3 sfx (bấm nút, thành công, thất bại)

**Test:** Bấm nút có tiếng, tắt/mở nhạc hoạt động

---

## ĐỢT 2: Quầy bán chính

### 2.1 Scene quầy
**Mục tiêu:** Hiện quầy phở với các vùng chạm

**Chi tiết:**
- [ ] AI gen: background quầy phở (nồi nước dùng, khay thịt, rau...)
- [ ] scenes/counter.js: render background full màn hình
- [ ] Định nghĩa hotspot zones (tọa độ %): nồi trụng, tô, nồi nước dùng, khay thịt, khay hành, khay topping, khay rau, khay bưng
- [ ] HUD trên cùng: đồng hồ | tiền | sao | ngày
- [ ] HUD dưới: 8 bước (highlight bước hiện tại)

**Test:** Thấy quầy + HUD đầy đủ, bấm hotspot có phản hồi visual

---

### 2.2 8 bước tapflow
**Mục tiêu:** Làm được 1 tô phở hoàn chỉnh

**Chi tiết:**
- [ ] logic/tapflow.js: state machine
  - State: { step: 0-7, bowls: [{noodle, broth, meat, scallion, toppings[], herbs}] }
  - Hàm: startDish(order), tap(hotspotId) → { newState, valid, message }
- [ ] Bước 0 (Trụng): chạm nồi → progress 3s → xong
- [ ] Bước 1 (Tô): chạm tô trống × N (N = số tô)
- [ ] Bước 2 (Nước dùng): chạm nồi → animation chan
- [ ] Bước 3 (Thịt): chạm khay ĐÚNG loại (check theo order)
- [ ] Bước 4 (Hành): chạm 1 lần
- [ ] Bước 5 (Topping): chạm từng topping theo order, check thiếu/thừa
- [ ] Bước 6 (Rau): chạm 1 lần
- [ ] Bước 7 (Bưng): chạm → validate → done
- [ ] Sai thứ tự → hiện gợi ý "Cần làm X trước"

**Test:** Làm 1 tô phở tái đúng quy trình → thành công. Làm sai topping → báo sai.

---

### 2.3 Khách hàng
**Mục tiêu:** Khách đến, gọi món, chờ, bỏ đi

**Chi tiết:**
- [ ] AI gen: 4 kiểu khách (ông già, cô gái, anh shipper, bà cụ)
- [ ] logic/arrivals.js: Poisson arrival (λ theo giờ + sao)
- [ ] logic/queue.js: tối đa 3 khách, shipper ưu tiên
- [ ] Render: khách + tên + order (icon món) + thanh kiên nhẫn (xanh→vàng→đỏ)
- [ ] Hết kiên nhẫn → khách bỏ đi, -1★, hiện "Khách bỏ đi!"
- [ ] Khách gọi: random món từ menu đã unlock, 1-3 tô

**Test:** Khách đến → hiện order → chờ → bỏ đi khi hết giờ

---

### 2.4 Tiền + sao + thời gian
**Mục tiêu:** Hệ thống kinh tế chạy đúng

**Chi tiết:**
- [ ] Giao đúng → +tiền (giá món + topping), +sao nếu ngon
- [ ] Giao sai → 0đ, -1★
- [ ] Khách bỏ đi → -1★
- [ ] Đồng hồ: 6:00 → 21:00, 1h game = 18s thực
- [ ] Hết 21h → toast "Ngày mới", reset khách, trừ chi phí
- [ ] Sao ảnh hưởng lượng khách (công thức đã định)

**Test:** Bán 1 tô → tiền tăng đúng giá. Qua ngày → trừ chi phí.

---

## ĐỢT 3: Hệ thống nâng cao

### 3.1 Giờ cao điểm + sự cố
**Chi tiết:**
- [ ] Peak hours (7-11h, 18-20h): arrival ×2, icon 🔥
- [ ] logic/incidents.js: 6 loại sự cố phở
  - Hết nước dùng, khách chê nhạt, nhầm tô, bom hàng, QR giả, shipper đổ
- [ ] Risk tăng theo ngày: ngày 2 = 1.0, +0.1/ngày, max 1.8
- [ ] Modal sự cố: hiện thông tin + nút xử lý

**Test:** Đến giờ cao điểm → khách đông. Sự cố xảy ra → modal hiện.

---

### 3.2 Đơn app + shipper
**Chi tiết:**
- [ ] Mở khóa ngày 2
- [ ] Modal điện thoại: hiện đơn → Nhận/Hủy
- [ ] Shipper: tên hài, app (PhoFood, NgonExpress...), 1-3 suất
- [ ] Ưu tiên lên đầu hàng
- [ ] Bom hàng: sau khi giao 6-15s mới biết

**Test:** Có đơn app → nhận → làm → giao → có thể bị bom

---

### 3.3 Feedback khách hàng ⭐
**Chi tiết:**
- [ ] logic/feedback.js: sau giao 4s → đánh giá
- [ ] Dựa vào: điểm món + thời gian chờ + sự cố
- [ ] Bong bóng chat + animation mặt (cười/mếu)
- [ ] Câu feedback theo từng trường hợp (20+ câu)
- [ ] Ảnh hưởng sao trực tiếp

**Test:** Giao ngon → khách khen. Giao dở → khách chê + mất sao.

---

### 3.4 Huy hiệu + Thử thách
**Chi tiết:**
- [ ] logic/progression.js: check điều kiện realtime
- [ ] 6 huy hiệu + banner chúc mừng + tủ trưng bày
- [ ] 3 thử thách/ngày + thử thách tuần
- [ ] Lưu tiến trình vào save

**Test:** Đạt điều kiện → huy hiệu mở, có thưởng

---

### 3.5 Save/load
**Chi tiết:**
- [ ] logic/save.js: localStorage key `pho-di/v1`
- [ ] Lưu: tiền, sao, ngày, khách, kệ, cài đặt
- [ ] Lưu liên tục mỗi 5s + khi rời trang
- [ ] Mở lại → vào thẳng quầy, tạm dừng chờ "Bán tiếp"

**Test:** Thoát giữa chừng → mở lại → tiếp tục được

---

## ĐỢT 4: Hoàn thiện

### 4.1 Minigame chuẩn bị
**Chi tiết:**
- [ ] 4 minigame: Ninh xương (chạm khi sôi), Thái thịt (vuốt), Rửa rau (chạm rau bẩn), Pha mắm (theo công thức)
- [ ] Mỗi cái 1-3 thao tác, không chấm điểm
- [ ] Làm lại mỗi 2 ngày

**Test:** Chơi được cả 4 minigame

---

### 4.2 Menu unlock
**Chi tiết:**
- [ ] Check điều kiện: ngày + sao + doanh thu + số tô
- [ ] Banner "🎉 Mở khóa: Phở tái nạm!"
- [ ] Món mới xuất hiện trong order khách

**Test:** Đến ngày 3 + đủ sao → món mới unlock

---

### 4.3 Polish visual
**Chi tiết:**
- [ ] Animation: khói tô phở, khách cười, sao bay, tiền bay
- [ ] Ambient: khói bốc liên tục từ nồi/tô (CSS, lặp vô hạn)
- [ ] Khách idle bobbing (translateY ±3px)
- [ ] Khách đến/đi: slide-in/out
- [ ] Nút bấm feedback mạnh (scale + shadow)
- [ ] Background intro: đèn lồng đung đưa, khói bếp
- [ ] So sánh với Bánh cuốn từng màn hình
- [ ] Fix mọi chỗ xấu hơn
- [ ] Tony duyệt visual cuối

**Test:** Anh Tony OK

---

### 4.5 Polish màn intro (tổng hợp review 2026-10-05)
**Nguồn:** Tony review ảnh chụp màn intro, liệt kê 7 lỗi UI/UX + 5 cải thiện + 4 performance

**Lỗi UI:**
- [ ] Chữ tên quán nằm quá thấp trên bảng gỗ (y~580, 76% chiều cao) → đưa lên giữa bảng
- [ ] Icon tô phở đè lên viền dưới bảng gỗ → tách ra, không che chi tiết gỗ
- [ ] Bảng gỗ dính sát mép trên, thiếu khoảng thở → cân đối lại padding
- [ ] Chữ "Phở Đi!" đè lên mái hiên sọc (khó đọc) → thêm shadow hoặc dời lên vùng nền trơn
- [ ] v0.1.0 quá mờ, trông như lỗi render → cho vào góc hoặc bỏ

**Màu sắc:**
- [ ] Chữ "Phở Đi!" đỏ quá gắt (vi phạm rule contrast thấp) → giảm saturation về đỏ gạch #C0392B
- [ ] Nút âm thanh nâu quá đậm → đổi sang nâu nhạt/cam nhạt
- [ ] Nút âm thanh không thể hiện trạng thái bật/tắt → thêm visual mờ/gạch chéo khi tắt
- [ ] Icon loa hơi nhỏ, chi tiết sóng âm mờ → tăng kích thước icon

**Cải thiện UX:**
- [ ] Tagline "Quản lý quán phở của bạn!" dưới title
- [ ] Nút "Bắt đầu chơi" pulse nhẹ (scale 1.0→1.03)
- [ ] Label "Tên quán:" cho ô input
- [ ] Hint: khi gõ tên, nhấp nháy nhẹ chữ trên bảng 1 lần

**Performance:**
- [ ] Màu nền chờ kem #F6EEDC cho `.intro-bg` (khi ảnh 3MB chưa load)
- [ ] `<link rel="preload" as="image">` cho background trong index.html
- [ ] Bản mobile 1080×2340 nhẹ hơn (~300KB), giữ 8K cho desktop
- [ ] (optional) Blur-up: thumbnail 20px blur làm placeholder

**Test:** Chụp screenshot so sánh trước/sau, Tony duyệt

---

### 4.4 Deploy
**Chi tiết:**
- [ ] Test full flow: từ đầu → sập tiệm → chơi lại, không lỗi
- [ ] Test trên Chrome mobile + iPhone Safari
- [ ] Push lên GitHub Pages (repo pho-di)
- [ ] Kiểm tra link live hoạt động

**Test:** Chơi được trên điện thoại thật qua link live

---
**Tổng: 16 task. Mỗi task xong phải qua VERIFY (test theo tiêu chí) mới sang task tiếp.**
