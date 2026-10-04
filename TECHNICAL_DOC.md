# TECHNICAL DOC — Game "Phở Đi!" 🍜

## 1. Kiến trúc tổng thể

```
pho-di/
├── index.html              # Entry HTML, mobile viewport, PWA meta
├── manifest.webmanifest    # PWA config
├── styles.css              # Style chính
├── portrait.css            # Style màn dọc
├── src/
│   ├── main.js             # Entry JS: load config → intro → counter
│   ├── config.json         # TOÀN BỘ số cân bằng game
│   ├── audio.js            # Web Audio: nhạc nền + sfx
│   ├── logic/              # Pure functions (không chạm DOM)
│   │   ├── rng.js          # Seeded RNG (mulberry32)
│   │   ├── save.js         # localStorage save/load
│   │   ├── counter.js      # State machine quầy bán
│   │   ├── tapflow.js      # 8 bước làm phở
│   │   ├── scoring.js      # Chấm điểm món
│   │   ├── arrivals.js     # Sinh khách (Poisson)
│   │   ├── queue.js        # Hàng đợi
│   │   ├── progression.js  # Ngày, unlock, huy hiệu, thử thách
│   │   ├── feedback.js     # ⭐ Feedback khách hàng (mới)
│   │   └── incidents.js    # Sự cố/rủi ro
│   └── scenes/             # DOM rendering
│       ├── intro.js        # Màn bắt đầu
│       ├── prep.js         # Minigame chuẩn bị
│       └── counter.js      # Scene quầy chính
└── assets/
    ├── sprites/            # Nguyên liệu, tô phở, khách
    ├── backgrounds/        # Quầy phở
    ├── prep/               # Ảnh minigame chuẩn bị
    ├── ui/                 # Icon, nút, sao
    └── audio/              # Nhạc + sfx (wav/mp3)
```

## 2. Data Model

### GameState
```js
{
  money: 500000,
  stars: 3.0,
  day: 1, month: 1,
  hour: 6.0,              // 6:00 - 21:00
  customers: [],          // hàng đợi
  shelf: [],              // tô làm sẵn (tối đa 3)
  currentDish: null,      // tô đang làm
  unlocked: ['pho_tai', 'pho_chin', 'pho_ga'],
  badges: [],
  challenges: [],         // thử thách hôm nay
  stats: { served: 0, failed: 0, revenue: 0 }
}
```

### Customer
```js
{
  id, type: 'walkin' | 'shipper',
  order: [{ dish: 'pho_tai', toppings: ['quay', 'trung'], qty: 1 }],
  patience: 100,          // giây
  maxPatience: 100,
  mood: 'happy' | 'neutral' | 'angry',
  feedback: null          // sau khi ăn
}
```

### Dish (tô phở đang làm)
```js
{
  step: 0,                // 0-7 (8 bước)
  bowls: [{              // mỗi tô
    noodle: false,        // đã trụng bánh
    broth: false,         // đã chan nước
    meat: null,           // 'tai' | 'chin' | 'ga'
    scallion: false,
    toppings: [],
    herbs: false
  }],
  targetOrder: null       // order khách để đối chiếu
}
```

## 3. Config (config.json)

```json
{
  "startMoney": 500000,
  "dayStartHour": 6, "dayEndHour": 21,
  "secondsPerGameHour": 18,
  "peakHours": [[7,11],[18,20]],
  "dishes": {
    "pho_tai":   { "price": 35000, "unlockDay": 1, "meat": "tai" },
    "pho_chin":  { "price": 35000, "unlockDay": 1, "meat": "chin" },
    "pho_ga":    { "price": 30000, "unlockDay": 1, "meat": "ga" },
    "pho_tainam":{ "price": 40000, "unlockDay": 3, "stars": 3 },
    "pho_db":    { "price": 50000, "unlockDay": 5, "revenue": 500000 }
  },
  "toppings": {
    "quay": 5000, "trung": 7000, "gia": 3000,
    "them_thit": 15000, "them_banh": 5000
  },
  "incidents": { "startDay": 2, "baseRate": 1.0, "perDay": 0.1, "max": 1.8 },
  "feedback": {
    "delay": 4,
    "positive": ["Nước dùng ngọt thanh quá!", "Thịt bò mềm tuyệt!"],
    "negative": ["Phở nguội rồi!", "Nước lèo nhạt quá!"],
    "slow": ["Chờ lâu quá đi!"]
  }
}
```

## 4. 8 Bước Tapflow (chi tiết)

```
Bước 0: TRỤNG BÁNH
  - Chạm nồi nước sôi → thanh tiến trình chạy 3s
  - Đủ số tô thì sang bước 1
  
Bước 1: CHO VÀO TÔ
  - Chạm tô trống (số lượng = số tô khách gọi)
  
Bước 2: CHAN NƯỚC DÙNG
  - Chạm nồi nước dùng → animation chan
  
Bước 3: THỊT
  - Chạm khay thịt ĐÚNG loại (tái/chín/gà theo món)
  - Sai loại → cảnh báo
  
Bước 4: HÀNH NGÒ
  - Chạm khay hành (1 lần cho tất cả tô)
  
Bước 5: TOPPING ⭐ (chỗ duy nhất có thể sai)
  - Chạm các khay topping theo order
  - Thiếu/thừa → sai
  
Bước 6: RAU THƠM
  - Chạm khay rau
  
Bước 7: BƯNG RA
  - Chạm khay → kiểm tra đúng/sai → giao khách
```

## 5. Hệ thống Feedback ⭐ (mới)

```js
// Sau khi giao món 4 giây:
function showFeedback(customer, dishResult) {
  let text, mood;
  if (dishResult.score >= 90) {
    text = pick(feedback.positive);
    mood = 'happy';
    stars += 0.2;
  } else if (dishResult.score >= 70) {
    text = "Cũng được!";
    mood = 'neutral';
  } else {
    text = pick(feedback.negative);
    mood = 'angry';
    stars -= 0.5;
  }
  // Hiện bong bóng chat + animation mặt
  renderBubble(customer, text, mood);
}
```

## 6. API giữa Logic và Scene

```js
// logic/counter.js
export function tickCounter(state, dt, rng) {
  // Pure function: state cũ + dt → { newState, events[] }
  // events: ['customer_arrived', 'customer_left', 'incident', ...]
}

// scenes/counter.js
export function mountCounter(host, { cfg, rng }) {
  // Render DOM, xử lý chạm, gọi tickCounter mỗi frame
}
```

## 7. Chi tiết Task Breakdown

### ĐỢT 1: Khung game (3 task)
**1.1** Setup project
- index.html (viewport, PWA meta, font)
- manifest.webmanifest
- styles.css + portrait.css (layout mobile 430×920)
- src/config.json (số liệu cơ bản)
- Test: mở trang thấy màn hình trắng + chữ "Phở Đi!"

**1.2** Màn Bắt đầu + Intro
- assets/ui: background màn bắt đầu (AI gen)
- scenes/intro.js: hiện ảnh + nút "Bắt đầu chơi"
- Test: bấm nút chuyển sang màn tiếp

**1.3** Hệ thống âm thanh
- audio.js: Web Audio API, nhạc nền loop, sfx
- Nút bật/tắt nhạc/sfx
- Unlock audio ở chạm đầu (iOS)
- Test: có tiếng khi bấm nút

### ĐỢT 2: Quầy bán chính (4 task)
**2.1** Scene quầy
- assets/backgrounds: quầy phở (AI gen, đẹp hơn Bánh cuốn)
- scenes/counter.js: render background + hotspot zones
- HUD: đồng hồ, tiền, sao, ngày
- Test: thấy quầy + HUD

**2.2** 8 bước tapflow
- logic/tapflow.js: state machine 8 bước
- Mỗi bước: hotspot + validation + animation
- Test: làm đủ 8 bước ra được tô phở

**2.3** Khách hàng
- logic/arrivals.js: sinh khách Poisson
- logic/queue.js: hàng đợi (tối đa 3)
- Render khách + thanh kiên nhẫn + order
- Test: khách đến, chờ, bỏ đi khi hết kiên nhẫn

**2.4** Tiền + sao + thời gian
- Giao đúng → +tiền, +sao
- Giao sai → -sao
- Đồng hồ chạy 6h→21h
- Test: số liệu cập nhật đúng

### ĐỢT 3: Hệ thống nâng cao (5 task)
**3.1** Giờ cao điểm + sự cố
- logic/incidents.js: các loại sự cố phở
- Peak hours ×2 khách
- Test: sự cố xảy ra, modal hiện

**3.2** Đơn app + shipper
- Modal xác nhận đơn
- Shipper ưu tiên hàng đợi
- Bom hàng, đổ vỡ
- Test: đơn app hoạt động

**3.3** Feedback khách hàng ⭐
- logic/feedback.js
- Bong bóng chat + animation mặt
- Ảnh hưởng sao
- Test: feedback hiện sau 4s

**3.4** Huy hiệu + Thử thách
- logic/progression.js: check điều kiện
- Banner mở khóa + tủ huy hiệu
- Thử thách ngày/tuần
- Test: huy hiệu mở đúng điều kiện

**3.5** Save/load
- logic/save.js: localStorage
- Lưu liên tục, resume khi mở lại
- Test: thoát app mở lại tiếp tục được

### ĐỢT 4: Hoàn thiện (4 task)
**4.1** Minigame chuẩn bị
- 4 minigame: ninh xương, thái thịt, rửa rau, pha mắm
- assets/prep: ảnh before/after
- Test: chơi được minigame

**4.2** Menu unlock
- Điều kiện mở khóa (ngày + sao + doanh thu)
- Banner "Mở khóa mới!"
- Test: món mới hiện đúng ngày

**4.3** Polish visual
- Animation: khói tô phở, khách cười, sao bay
- So sánh với Bánh cuốn, đảm bảo đẹp hơn
- Test: anh duyệt visual

**4.4** Deploy
- Test full flow không lỗi
- Push GitHub Pages
- Test trên điện thoại thật

---
**Tổng: 16 task, 4 đợt. Anh duyệt thì em bắt đầu 1.1.**
