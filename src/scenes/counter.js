// Phở Đi! - Scene: Quầy bán chính (v2)
// Background CSS + sprite, không dùng ảnh AI

import { playSfx } from '../audio.js';
import { createTapflow, STEP_NAMES, MEAT_NAMES, TOPPING_NAMES, TRUNG_DURATION_MS } from '../logic/tapflow.js';
import { randomCustomer, nextArrivalInterval, parseHour } from '../logic/arrivals.js';
import { createQueue } from '../logic/queue.js';
import { calcPrice, formatVND, DAILY_RENT } from '../logic/economy.js';

// Task 2.4b: 18 giây thực = 1 giờ game; đồng hồ chạy 6:00 → 21:00
const GAME_START_MIN = 6 * 60;   // 6:00
const GAME_END_MIN = 21 * 60;    // 21:00
const REAL_SEC_PER_GAME_HOUR = 18;
const GAME_MIN_PER_REAL_SEC = 60 / REAL_SEC_PER_GAME_HOUR;

// 8 bước làm phở
export const STEPS = [
  { id: 'trung',   label: 'Trụng',   icon: 'assets/icons/steps/trung.webp' },
  { id: 'to',      label: 'Tô',      icon: 'assets/icons/steps/to.webp' },
  { id: 'nuoc',    label: 'Nước',    icon: 'assets/icons/steps/nuoc.webp' },
  { id: 'thit',    label: 'Thịt',    icon: 'assets/icons/steps/thit.webp' },
  { id: 'hanh',    label: 'Hành',    icon: 'assets/icons/steps/hanh.webp' },
  { id: 'topping', label: 'Topping', icon: 'assets/icons/steps/topping.webp' },
  { id: 'rau',     label: 'Rau',     icon: 'assets/icons/steps/rau.webp' },
  { id: 'bung',    label: 'Bưng',    icon: 'assets/icons/steps/bung.webp' },
];

// Các trạm trên quầy — mỗi trạm có sprite riêng
// Layout: grid 3 cột, tự động đều nhau
const STATIONS = [
  { id: 'noi-trung', label: 'Trụng bánh', sprite: 'assets/sprites/banh-pho-v2.webp' },
  { id: 'noi-nuoc', label: 'Nước dùng', sprite: 'assets/sprites/noi-nuoc-dung-v2.webp' },
  { id: 'to', label: 'Tô', sprite: 'assets/sprites/to-pho-v2.webp' },
  { id: 'khay-thit', label: 'Thịt bò', sprite: 'assets/sprites/thit-bo-tai-v2.webp' },
  { id: 'khay-ga', label: 'Thịt gà', sprite: 'assets/sprites/thit-ga-v2.webp' },
  { id: 'khay-hanh', label: 'Hành ngò', sprite: 'assets/sprites/hanh-ngo-v2.webp' },
  { id: 'khay-rau', label: 'Rau thơm', sprite: 'assets/sprites/rau-thom-v2.webp' },
  { id: 'khay-topping', label: 'Topping', sprite: 'assets/sprites/quay-v2.webp' },
  { id: 'khay-trung', label: 'Trứng', sprite: 'assets/sprites/trung-chan-v2.webp' },
  { id: 'khay-gia', label: 'Giá', sprite: 'assets/sprites/gia-do-v2.webp' },
];

export function renderCounter(container, state, callbacks = {}) {
  const { onHotspot = () => {}, onBack = () => {} } = callbacks;

  // Task 2.3: khách hàng — order lấy từ khách đầu hàng, không còn DEMO_ORDER
  const CUSTOMER_SPRITES = {
    'ong-gia': 'assets/sprites/ong-gia-v2.webp',
    'co-gai': 'assets/sprites/co-gai-v2.webp',
    'shipper': 'assets/sprites/shipper-v2.webp',
    'ba-cu': 'assets/sprites/ba-cu-v2.webp',
  };
  const queue = createQueue(3);
  let cooking = false; // đang nấu cho khách đầu hàng?
  let arrivalTimer = null;
  let patienceTimer = null;
  let clockTimer = null; // Task 2.4b: đồng hồ game
  let dishGen = 0; // token chống race: tăng mỗi lần startDish

  const flow = createTapflow();
  // Chưa có khách → chưa startDish; tap sẽ báo "Chưa có order nào."

  const orderText = () => {
    const o = flow.getState().order;
    if (!o) return '';
    const tops = o.toppings.map(t => TOPPING_NAMES[t]).join(' + ') || 'không topping';
    return `Phở ${MEAT_NAMES[o.meat]} + ${tops}`;
  };

  const shortOrderText = (order) => {
    const tops = order.toppings.map(t => TOPPING_NAMES[t]).join(' + ');
    return `Phở ${MEAT_NAMES[order.meat]}${tops ? ' + ' + tops : ''}`;
  };

  const updateTicket = () => {
    const active = cooking ? queue.peek() : null;
    container.querySelector('#order-text').textContent =
      active ? `${active.name}: ${orderText()}` : 'Chờ khách...';
  };

  container.innerHTML = `
    <div class="counter-bg-css"></div>
    <div class="hud-top">
      <button id="btn-counter-back" class="btn-back-hud">←</button>
      <div class="hud-item"><img src="assets/icons/clock.webp" class="hud-icon"> <span id="hud-time">${state.time || '6:00'}</span></div>
      <div class="hud-item"><img src="assets/icons/money.webp" class="hud-icon"> <span id="hud-money">${(state.money || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="hud-item"><img src="assets/icons/star.webp" class="hud-icon"> <span id="hud-star">${state.stars || 0}</span></div>
      <div class="hud-item"><img src="assets/icons/day.webp" class="hud-icon"> <span id="hud-day">Ngày ${state.day || 1}</span></div>
    </div>
    <div class="order-ticket">🧾 <span id="order-text">Chờ khách...</span></div>
    <div class="customer-row" id="customer-row" hidden></div>
    <div class="station-layer">
      ${STATIONS.map(s => `
        <button class="station" data-id="${s.id}">
          <img src="${s.sprite}" alt="${s.label}" draggable="false">
          <span class="station-label">${s.label}</span>
          <span class="progress-fill"></span>
        </button>
      `).join('')}
    </div>
    <div class="serve-overlay" id="serve-overlay" hidden>
      <button class="btn-serve" id="btn-serve"><img src="assets/icons/steps/bung.webp" style="width:24px;height:24px;vertical-align:middle;"> Bưng ra phục vụ!</button>
    </div>
    <div class="toast" id="toast" hidden></div>
    <div class="hud-steps">
      ${STEPS.map((s, i) => `
        <div class="step" data-step="${i}">
          <span class="step-icon"><img src="${s.icon}" alt="${s.label}"></span>
          <span class="step-label">${s.label}</span>
        </div>
      `).join('')}
    </div>
  `;

  state.currentStep = 0;
  syncSteps();

  let toastTimer = null;
  function toast(msg, isErr) {
    const el = container.querySelector('#toast');
    el.innerHTML = msg;
    el.classList.toggle('err', !!isErr);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function syncSteps() {
    const step = flow.getState().step;
    state.currentStep = step;
    container.querySelectorAll('.step').forEach((el, i) => {
      el.classList.toggle('active', i === step);
      el.classList.toggle('done', i < step);
    });
    // Hiện nút bưng từ bước 4 trở đi (cho phép bỏ qua bước tùy chọn)
    container.querySelector('#serve-overlay').hidden = step < 4;
  }

  // ---------- Task 2.3c: UI khách hàng ----------

  function renderCustomers() {
    const row = container.querySelector('#customer-row');
    const list = queue.list();
    const activeId = cooking && list.length ? list[0].id : null;
    row.hidden = list.length === 0;
    row.innerHTML = list.map(c => {
      const pct = Math.max(0, (c.patience / c.maxPatience) * 100);
      const cls = pct > 50 ? 'high' : pct > 25 ? 'mid' : 'low';
      return `
      <div class="customer${c.id === activeId ? ' serving' : ''}" data-id="${c.id}">
        <img class="customer-avatar" src="${CUSTOMER_SPRITES[c.type]}" alt="${c.name}" draggable="false">
        <div class="customer-name">${c.name}${c.type === 'shipper' ? ' 🛵' : ''}</div>
        <div class="customer-order">${shortOrderText(c.order)}</div>
        <div class="patience-bar"><div class="patience-fill ${cls}" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  // Cập nhật thanh kiên nhẫn (không re-render cả hàng)
  function updatePatienceBars() {
    for (const c of queue.list()) {
      const fill = container.querySelector(`.customer[data-id="${c.id}"] .patience-fill`);
      if (!fill) continue;
      const pct = Math.max(0, (c.patience / c.maxPatience) * 100);
      fill.style.width = pct + '%';
      fill.classList.toggle('high', pct > 50);
      fill.classList.toggle('mid', pct > 25 && pct <= 50);
      fill.classList.toggle('low', pct <= 25);
    }
  }

  // Bắt đầu nấu cho khách đầu hàng (hoặc về trạng thái chờ)
  function startNextDish() {
    const next = queue.peek();
    if (next) {
      cooking = true;
      dishGen++; // tăng token mỗi lần bắt đầu món mới
      flow.startDish(next.order);
    } else {
      cooking = false;
      flow.clearOrder(); // tránh món ma: reset tapflow khi hết khách
    }
    updateTicket();
    syncSteps();
    // Idle (không khách): step vẫn 7 từ món cũ → ép ẩn nút bưng
    if (!cooking) container.querySelector('#serve-overlay').hidden = true;
    renderCustomers();
  }

  function scheduleArrival(delayMs) {
    clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => {
      if (!container.isConnected) return;
      if (!queue.isFull()) {
        const c = randomCustomer();
        queue.enqueue(c, cooking);
        toast(`<img src="assets/icons/bell.webp" class="toast-icon"> Khách mới: ${c.name}!`);
        playSfx('pop');
        if (!cooking) startNextDish();
        else renderCustomers();
      }
      scheduleArrival(nextArrivalInterval(state.stars || 0, parseHour(state.time)));
    }, delayMs);
  }

  function startPatienceTicker() {
    clearInterval(patienceTimer);
    patienceTimer = setInterval(() => {
      if (!container.isConnected) return;
      let leftCount = 0;
      let activeLeft = false;
      let activeName = '';
      for (const c of queue.list()) {
        c.patience -= 1;
        if (c.patience > 0) continue;
        const wasActive = cooking && queue.peek() && queue.peek().id === c.id;
        queue.removeById(c.id);
        if (wasActive) { activeLeft = true; activeName = c.name; }
        leftCount++;
      }
      if (leftCount === 0) {
        updatePatienceBars();
        return;
      }
      state.stars = Math.max(0, (state.stars || 0) - leftCount);
      updateHUD(container, state);
      playSfx('fail');
      if (activeLeft) {
        // Khách đang nấu bỏ đi → hủy món dở, chuyển sang khách tiếp theo
        toast(`<img src="assets/icons/bell.webp" class="toast-icon"> ${activeName} bỏ đi! Món dở bị hủy. -${leftCount}<img src="assets/icons/star.webp" class="toast-icon">`, true);
        startNextDish();
      } else {
        toast(`<img src="assets/icons/bell.webp" class="toast-icon"> ${leftCount} khách bỏ đi! -${leftCount}<img src="assets/icons/star.webp" class="toast-icon">`, true);
        renderCustomers();
      }
    }, 1000);
  }

  function startClock() {
    clearInterval(clockTimer);
    // Parse state.time "H:MM" -> phút; fallback 6:00
    const parseMinutes = (t) => {
      const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
      if (!m) return GAME_START_MIN;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };
    let gameMin = parseMinutes(state.time);
    const fmt = (mins) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${h}:${String(m).padStart(2, '0')}`;
    };
    clockTimer = setInterval(() => {
      if (!container.isConnected) return;
      gameMin += GAME_MIN_PER_REAL_SEC;
      if (gameMin >= GAME_END_MIN) {
        // Hết ngày: qua ngày mới
        clearInterval(clockTimer);
        state.day = (state.day || 1) + 1;
        state.time = '6:00';
        state.money = Math.max(0, (state.money || 0) - DAILY_RENT);
        // Xóa hết khách đang chờ
        queue.list().forEach(c => queue.removeById(c.id));
        cooking = false;
        dishGen++; // chống race: hủy progress trụng đang chạy dở
        flow.clearOrder();
        updateHUD(container, state);
        updateTicket();
        syncSteps(); // reset thanh 8 bước + ẩn nút bưng
        renderCustomers();
        toast(`🌙 Hết ngày! Trừ tiền mặt bằng ${formatVND(DAILY_RENT)}. Ngày ${state.day} bắt đầu!`);
        playSfx('success');
        startClock(); // bắt đầu ngày mới
        scheduleArrival(2500);
        return;
      }
      state.time = fmt(gameMin);
      const el = container.querySelector('#hud-time');
      if (el) el.textContent = state.time;
    }, 1000);
  }

  function runTrungProgress(btn) {
    btn.classList.add('progressing');
    playSfx('pop');
    const gen = dishGen; // capture token để phát hiện món bị reset giữa chừng
    // Lưu timeoutId để clear khi unmount; check isConnected tránh race khi bấm back
    const tid = setTimeout(() => {
      if (!container.isConnected || gen !== dishGen) return; // món đã bị reset → bỏ qua
      btn.classList.remove('progressing');
      const r = flow.completeProgress();
      toast(r.message, !r.valid);
      if (r.valid) playSfx('success');
      syncSteps();
    }, TRUNG_DURATION_MS);
    // Clear timeout khi bấm back (tránh sync vào container đã unmount)
    container.querySelector('#btn-counter-back').addEventListener('click', () => clearTimeout(tid), { once: true });
  }

  function handleTap(hotspotId, btn) {
    const r = flow.tap(hotspotId);
    toast(r.message, !r.valid);
    if (!r.valid) {
      playSfx('fail');
      return;
    }
    if (r.progress) {
      // Bước trụng: progress 3s
      runTrungProgress(btn);
      return;
    }
    if (hotspotId === 'noi-nuoc') {
      // Animation chan nước dùng
      btn.classList.add('pouring');
      setTimeout(() => btn.classList.remove('pouring'), 900);
    }
    playSfx(r.done ? 'coin' : 'success');
    if (r.done) {
      // Task 2.3: bưng xong → gán cho khách đầu hàng, khách rời đi vui vẻ
      const served = queue.dequeue();
      cooking = false;
      container.querySelector('#serve-overlay').hidden = true;
      if (served) {
        // Task 2.4a+2.4c: tính tiền đúng theo giá món + topping
        const price = calcPrice(served.order);
        state.money = (state.money || 0) + price;
        // "Ngon" = đủ nguyên liệu tùy chọn → +1 sao; thiếu → -1 sao
        let starMsg = '';
        if (r.perfect) {
          state.stars = (state.stars || 0) + 1;
          starMsg = ' +1<img src="assets/icons/star.webp" class="toast-icon">';
        } else {
          state.stars = Math.max(0, (state.stars || 0) - 1);
          starMsg = ' -1<img src="assets/icons/star.webp" class="toast-icon"> (thiếu nguyên liệu)';
        }
        updateHUD(container, state);
        toast(`😊 ${served.name} hài lòng! +${formatVND(price)}${starMsg}`);
      }
      setTimeout(() => {
        if (!container.isConnected || cooking) return; // đã có món mới đang nấu thì bỏ qua
        startNextDish();
      }, 1500);
    }
    syncSteps();
    onHotspot(hotspotId);
  }

  container.querySelectorAll('.station').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('tapped');
      setTimeout(() => btn.classList.remove('tapped'), 200);
      handleTap(btn.dataset.id, btn);
    });
  });

  container.querySelector('#btn-serve').addEventListener('click', () => {
    handleTap('serve', null);
  });

  container.querySelector('#btn-counter-back').addEventListener('click', () => {
    playSfx('click');
    clearTimeout(arrivalTimer);
    clearInterval(patienceTimer);
    clearInterval(clockTimer);
    clearTimeout(toastTimer);
    onBack();
  });

  // Task 2.3: bắt đầu đón khách — khách đầu sau 2.5s, sau đó theo Poisson
  // Task 2.4b: khởi động đồng hồ game
  updateTicket();
  renderCustomers();
  scheduleArrival(2500);
  startPatienceTicker();
  startClock();
}

export function updateHUD(container, state) {
  const set = (id, val) => {
    const el = container.querySelector(id);
    if (el) el.textContent = val;
  };
  set('#hud-time', state.time || '6:00');
  set('#hud-money', `${(state.money || 0).toLocaleString('vi-VN')}đ`);
  set('#hud-star', state.stars || 0);
  set('#hud-day', `Ngày ${state.day || 1}`);

  container.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === (state.currentStep || 0));
    el.classList.toggle('done', i < (state.currentStep || 0));
  });
}
