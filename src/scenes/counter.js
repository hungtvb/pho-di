// Phở Đi! - Scene: Quầy bán chính (v2)
// Background CSS + sprite, không dùng ảnh AI

import { playSfx } from '../audio.js';
import { createTapflow, STEP_NAMES, MEAT_NAMES, TOPPING_NAMES, TRUNG_DURATION_MS } from '../logic/tapflow.js';
import { randomCustomer, nextArrivalInterval, parseHour, isPeakHour } from '../logic/arrivals.js';
import { createQueue } from '../logic/queue.js';
import { calcPrice, calcCost, formatVND, DAILY_RENT } from '../logic/economy.js';
import { rollIncident } from '../logic/incidents.js';
import { randomAppOrder, shouldHaveAppOrder, rollAppCancel, appCancelDelayMs } from '../logic/appOrders.js';

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
  let cookingForId = null; // 3.1b: id khách đang được nấu
  let incidentModalOpen = false; // 3.1c: chống modal sự cố chồng lớp
  let appModalOpen = false; // 3.2: chống modal đơn app chồng lớp
  let appCustomerIdSeq = 1000000; // 3.2: id riêng cho khách app, tránh trùng arrivals.js

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

  // 3.1b: khách mục tiêu = khách đang chọn (nếu còn trong hàng), else đầu hàng
  const getTargetCustomer = () => {
    const list = queue.list();
    const sel = list.find(c => c.id === state.selectedCustomerId);
    return sel || list[0] || null;
  };

  const updateTicket = () => {
    const active = cooking ? getTargetCustomer() : null;
    container.querySelector('#order-text').textContent =
      active ? `${active.name}: ${orderText()}` : 'Chờ khách...';
  };

  container.innerHTML = `
    <div class="counter-bg-css"></div>
    <div class="hud-top">
      <button id="btn-counter-back" class="btn-back-hud"><img src="assets/icons/back.webp"></button>
      <div class="hud-item"><img src="assets/icons/clock.webp" class="hud-icon"> <span id="hud-time">${state.time || '6:00'}</span></div>
      <div class="hud-item"><img src="assets/icons/money.webp" class="hud-icon"> <span id="hud-money">${(state.money || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="hud-item"><img src="assets/icons/star.webp" class="hud-icon"> <span id="hud-star">${state.stars || 0}</span></div>
      <div class="hud-item"><img src="assets/icons/day.webp" class="hud-icon"> <span id="hud-day">Ngày ${state.day || 1}</span></div>
      <span id="hud-peak" class="hud-peak" hidden>PEAK</span>
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

  // 3.1b: chạm vào khách để chọn (toggle)
  container.querySelector('#customer-row').addEventListener('click', (e) => {
    const el = e.target.closest('.customer');
    if (!el) return;
    const id = Number(el.dataset.id);
    state.selectedCustomerId = (state.selectedCustomerId === id) ? null : id;
    playSfx('click');
    renderCustomers();
    updateTicket();
  });

  state.currentStep = 0;
  state.selectedCustomerId = null; // 3.1b: khách đang được chọn (null = đầu hàng)
  state.wasPeak = false; // 3.1a
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

  // Task 2.4e: công an kiểm tra cuối ngày (30%/ngày). Bỏ qua nếu đã mua mặt bằng.
  let policeModalOpen = false; // chống modal chồng lớp
  function maybePoliceCheck() {
    if (state.ownedPremises) return;
    if (policeModalOpen || incidentModalOpen || appModalOpen) return; // đang mở thì bỏ qua
    if (Math.random() >= 0.3) return;
    policeModalOpen = true;
    const fine = 20000 + Math.floor(Math.random() * 81) * 1000; // 20k-100k

    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
      <div class="name-modal-box">
        <h2>Công an kiểm tra!</h2>
        <p class="name-modal-desc">Quán vỉa hè không phép. Chọn cách xử lý:</p>
        <div class="police-choices">
          <button class="btn-primary police-btn" data-act="pay">Nộp phạt ${formatVND(fine)}</button>
          <button class="btn-primary police-btn" data-act="run">Dọn hàng nhanh</button>
          <button class="btn-primary police-btn" data-act="bribe">Lót tay 30.000đ</button>
        </div>
      </div>
    `;
    container.appendChild(modal);

    const close = () => {
      modal.remove();
      policeModalOpen = false;
    };

    modal.querySelector('[data-act="pay"]').addEventListener('click', () => {
      state.money = Math.max(0, (state.money || 0) - fine);
      updateHUD(container, state);
      playSfx('fail');
      toast(`Đã nộp phạt ${formatVND(fine)}.`, true);
      close();
    });

    modal.querySelector('[data-act="bribe"]').addEventListener('click', () => {
      state.money = Math.max(0, (state.money || 0) - 30000);
      updateHUD(container, state);
      playSfx('success');
      toast('Qua ải!');
      close();
    });

    modal.querySelector('[data-act="run"]').addEventListener('click', () => {
      // Minigame 3s: bấm "Dọn ngay!" kịp thì thoát, hết giờ phạt gấp đôi
      const box = modal.querySelector('.name-modal-box');
      let left = 3;
      let done = false; // chống race: chỉ xử lý 1 lần
      box.innerHTML = `
        <h2>Dọn hàng nhanh!</h2>
        <p class="name-modal-desc">Bấm nút trước khi hết giờ!</p>
        <p class="police-countdown" id="police-countdown">${left}</p>
        <button class="btn-primary police-btn" id="police-run-btn">Dọn ngay!</button>
      `;
      const countEl = box.querySelector('#police-countdown');
      const timer = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          if (done) return;
          done = true;
          clearInterval(timer);
          const doubleFine = fine * 2;
          state.money = Math.max(0, (state.money || 0) - doubleFine);
          updateHUD(container, state);
          playSfx('fail');
          toast(`Không kịp dọn! Phạt gấp đôi ${formatVND(doubleFine)}.`, true);
          close();
          return;
        }
        if (countEl.isConnected) countEl.textContent = left;
      }, 1000);
      box.querySelector('#police-run-btn').addEventListener('click', () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        playSfx('success');
        toast('Thoát! Dọn hàng kịp lúc.');
        close();
      });
    });
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
    // 3.1b: xóa chọn nếu khách đã rời hàng
    if (state.selectedCustomerId != null && !list.some(c => c.id === state.selectedCustomerId)) {
      state.selectedCustomerId = null;
    }
    const activeId = cooking ? cookingForId : null;
    const selId = state.selectedCustomerId;
    row.hidden = list.length === 0;
    row.innerHTML = list.map(c => {
      const pct = Math.max(0, (c.patience / c.maxPatience) * 100);
      const cls = pct > 50 ? 'high' : pct > 25 ? 'mid' : 'low';
      return `
      <div class="customer${c.id === activeId ? ' serving' : ''}${c.id === selId ? ' selected' : ''}" data-id="${c.id}">
        <img class="customer-avatar" src="${CUSTOMER_SPRITES[c.type]}" alt="${c.name}" draggable="false">
        <div class="customer-name">${c.name}${c.type === 'shipper' ? ' 🛵' : ''}${c.isAppOrder ? ' <span class="app-badge">APP</span>' : ''}</div>
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

  // Bắt đầu nấu cho khách mục tiêu (đang chọn hoặc đầu hàng)
  function startNextDish() {
    const next = getTargetCustomer();
    if (next) {
      cooking = true;
      cookingForId = next.id; // 3.1b
      dishGen++; // tăng token mỗi lần bắt đầu món mới
      flow.startDish(next.order);
    } else {
      cooking = false;
      cookingForId = null;
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
        const wasActive = cooking && cookingForId === c.id;
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
    let lastIncidentHour = Math.floor(gameMin / 60); // 3.1c
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
        // Task 2.4d: trừ tiền mặt bằng + vốn nguyên liệu đã dùng trong ngày
        const dayCost = state.dailyCost || 0;
        state.money = Math.max(0, (state.money || 0) - DAILY_RENT - dayCost);
        state.dailyCost = 0;
        // Xóa hết khách đang chờ
        queue.list().forEach(c => queue.removeById(c.id));
        cooking = false;
        cookingForId = null; // 3.1b
        state.selectedCustomerId = null; // 3.1b
        dishGen++; // chống race: hủy progress trụng đang chạy dở
        flow.clearOrder();
        updateHUD(container, state);
        updateTicket();
        syncSteps(); // reset thanh 8 bước + ẩn nút bưng
        renderCustomers();
        toast(`Hết ngày! Trừ mặt bằng ${formatVND(DAILY_RENT)} + vốn ${formatVND(dayCost)}. Ngày ${state.day} bắt đầu!`);
        playSfx('success');
        // Task 3.2: mở khóa đơn app từ ngày 2
        if (state.day === 2) {
          setTimeout(() => {
            if (!container.isConnected) return;
            playSfx('pop');
            toast(`<img src="assets/icons/bell.webp" class="toast-icon"> Đã mở khóa đơn app!`);
          }, 2000);
        }
        // Task 2.4e: công an kiểm tra (30%/ngày, bỏ qua nếu đã mua mặt bằng)
        maybePoliceCheck();
        startClock(); // bắt đầu ngày mới
        scheduleArrival(2500);
        return;
      }
      state.time = fmt(gameMin);
      const el = container.querySelector('#hud-time');
      if (el) el.textContent = state.time;
      // 3.1a: toast khi bước vào giờ cao điểm + cập nhật badge
      const hour = Math.floor(gameMin / 60);
      const peak = isPeakHour(hour);
      if (peak && !state.wasPeak) toast('Giờ cao điểm! Khách đông gấp đôi!');
      state.wasPeak = peak;
      const peakEl = container.querySelector('#hud-peak');
      if (peakEl) peakEl.hidden = !peak;
      // 3.1c: roll sự cố mỗi giờ game
      if (hour !== lastIncidentHour) {
        lastIncidentHour = hour;
        const inc = rollIncident(state.day || 1);
        if (inc) showIncidentModal(inc);
        // 3.2: đơn app (mở khóa ngày 2, ~15%/giờ)
        else if (shouldHaveAppOrder(state.day || 1) && !queue.isFull()) {
          showAppOrderModal(randomAppOrder(state.day || 1));
        }
      }
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
    // 3.1c: hết nước dùng — chặn trạm nước trong thời gian nấu lại
    if (hotspotId === 'noi-nuoc' && state.brothBlockedUntil && Date.now() < state.brothBlockedUntil) {
      const s = Math.ceil((state.brothBlockedUntil - Date.now()) / 1000);
      toast(`Đang nấu nước dùng! Chờ ${s} giây.`, true);
      playSfx('fail');
      return;
    }
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
      // 3.1b: giao cho khách đang chọn (fallback đầu hàng)
      const target = getTargetCustomer();
      const dishOrder = flow.getState().order;
      // 3.1c: nhầm tô — thịt của tô khác với thịt khách gọi
      if (target && dishOrder && target.order.meat !== dishOrder.meat) {
        showWrongBowlModal(target, dishOrder, r.perfect);
        return;
      }
      completeServe(target, r.perfect, false);
    }
    syncSteps();
    onHotspot(hotspotId);
  }

  // 3.1b+3.1c: hoàn tất phục vụ 1 khách
  function completeServe(target, perfect, wrongBowl) {
    if (target) queue.removeById(target.id);
    cooking = false;
    cookingForId = null;
    state.selectedCustomerId = null; // 3.1b: reset chọn sau khi giao
    container.querySelector('#serve-overlay').hidden = true;
    if (target) {
      // Task 2.4a+2.4c: tính tiền đúng theo giá món + topping
      const price = calcPrice(target.order);
      state.money = (state.money || 0) + price;
      // Task 2.4d: cộng vốn nguyên liệu vào chi phí ngày
      state.dailyCost = (state.dailyCost || 0) + calcCost(target.order);
      // "Ngon" = đủ nguyên liệu tùy chọn → +1 sao; thiếu/nhầm → -1 sao
      let starMsg = '';
      if (!wrongBowl && perfect) {
        state.stars = (state.stars || 0) + 1;
        starMsg = ' +1<img src="assets/icons/star.webp" class="toast-icon">';
      } else {
        state.stars = Math.max(0, (state.stars || 0) - 1);
        starMsg = ` -1<img src="assets/icons/star.webp" class="toast-icon">${wrongBowl ? ' (nhầm tô)' : ' (thiếu nguyên liệu)'}`;
      }
      updateHUD(container, state);
      toast(`😊 ${target.name} hài lòng! +${formatVND(price)}${starMsg}`);
      // 3.2: bom hàng đơn app — 20%, biết sau 6-15s; mất vốn (đã cộng dailyCost lúc bưng)
      if (target.isAppOrder) {
        const cost = calcCost(target.order);
        setTimeout(() => {
          if (!container.isConnected) return;
          if (rollAppCancel()) {
            state.money = Math.max(0, (state.money || 0) - cost);
            updateHUD(container, state);
            playSfx('fail');
            toast(`Bom hàng! ${target.name} (${target.appName}) hủy đơn. Mất vốn ${formatVND(cost)}.`, true);
          }
        }, appCancelDelayMs());
      }
    }
    setTimeout(() => {
      if (!container.isConnected || cooking) return; // đã có món mới đang nấu thì bỏ qua
      startNextDish();
    }, 1500);
  }

  // 3.1c: nhầm tô — tô làm cho thịt A nhưng khách gọi thịt B
  function showWrongBowlModal(target, dishOrder, perfect) {
    if (incidentModalOpen || policeModalOpen || appModalOpen) {
      // đang có modal khác: giao luôn để không kẹt game
      completeServe(target, perfect, true);
      return;
    }
    incidentModalOpen = true;
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
      <div class="name-modal-box">
        <h2>Nhầm tô!</h2>
        <p class="name-modal-desc">Tô này là phở ${MEAT_NAMES[dishOrder.meat]}, nhưng ${target.name} gọi phở ${MEAT_NAMES[target.order.meat]}.</p>
        <div class="police-choices">
          <button class="btn-primary police-btn" data-act="remake">Làm lại từ đầu</button>
          <button class="btn-primary police-btn" data-act="serve">Giao luôn (-1 sao)</button>
        </div>
      </div>
    `;
    container.appendChild(modal);
    const close = () => { modal.remove(); incidentModalOpen = false; };
    modal.querySelector('[data-act="remake"]').addEventListener('click', () => {
      flow.startDish(target.order);
      dishGen++;
      cookingForId = target.id;
      syncSteps();
      playSfx('click');
      toast(`Làm lại tô cho ${target.name}!`);
      close();
    });
    modal.querySelector('[data-act="serve"]').addEventListener('click', () => {
      playSfx('click');
      close();
      completeServe(target, perfect, true);
    });
  }

  // 3.1c: sự cố ngẫu nhiên mỗi giờ
  function showIncidentModal(type) {
    if (incidentModalOpen || policeModalOpen || appModalOpen) return;
    const nonCooking = () => queue.list().filter(c => !(cooking && c.id === cookingForId));
    if ((type === 'impatient' || type === 'cancelled') && nonCooking().length === 0) return;
    if (type === 'spilled' && !cooking) return;

    if (type === 'cancelled') {
      // Bom hàng: toast + trừ vốn ngay (không modal)
      const cands = nonCooking();
      const c = cands[Math.floor(Math.random() * cands.length)];
      const cost = calcCost(c.order);
      queue.removeById(c.id);
      if (state.selectedCustomerId === c.id) state.selectedCustomerId = null;
      state.money = Math.max(0, (state.money || 0) - cost);
      updateHUD(container, state);
      renderCustomers();
      updateTicket();
      playSfx('fail');
      toast(`Bom hàng! ${c.name} hủy đơn. Mất vốn ${formatVND(cost)}.`, true);
      return;
    }
    if (type === 'spilled') {
      // Shipper làm đổ: mất tô đang làm, -1 sao
      flow.clearOrder();
      cooking = false;
      cookingForId = null;
      state.stars = Math.max(0, (state.stars || 0) - 1);
      updateHUD(container, state);
      syncSteps();
      container.querySelector('#serve-overlay').hidden = true;
      playSfx('fail');
      toast('Shipper làm đổ tô đang làm! -1 sao.', true);
      startNextDish();
      return;
    }

    incidentModalOpen = true;
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    const close = () => { modal.remove(); incidentModalOpen = false; };

    if (type === 'no-broth') {
      modal.innerHTML = `
        <div class="name-modal-box">
          <h2>Hết nước dùng!</h2>
          <p class="name-modal-desc">Nồi nước dùng đã cạn. Chọn cách xử lý:</p>
          <div class="police-choices">
            <button class="btn-primary police-btn" data-act="cook">Nấu lại (30s)</button>
            <button class="btn-primary police-btn" data-act="buy">Mua sẵn (-20k)</button>
          </div>
        </div>`;
      container.appendChild(modal);
      modal.querySelector('[data-act="cook"]').addEventListener('click', () => {
        state.brothBlockedUntil = Date.now() + 30000;
        playSfx('click');
        toast('Đang nấu nước dùng mới...');
        close();
        setTimeout(() => {
          if (!container.isConnected) return;
          state.brothBlockedUntil = 0;
          toast('Nước dùng đã sẵn sàng!');
          playSfx('success');
        }, 30000);
      });
      modal.querySelector('[data-act="buy"]').addEventListener('click', () => {
        state.money = Math.max(0, (state.money || 0) - 20000);
        updateHUD(container, state);
        playSfx('success');
        toast('Đã mua nước dùng sẵn!');
        close();
      });
    } else if (type === 'impatient') {
      const cands = nonCooking();
      const c = cands[Math.floor(Math.random() * cands.length)];
      modal.innerHTML = `
        <div class="name-modal-box">
          <h2>Khách phàn nàn!</h2>
          <p class="name-modal-desc">${c.name} đợi lâu quá. Chọn cách xử lý:</p>
          <div class="police-choices">
            <button class="btn-primary police-btn" data-act="prior">Ưu tiên phục vụ</button>
            <button class="btn-primary police-btn" data-act="gift">Tặng quẩy (-5k)</button>
            <button class="btn-primary police-btn" data-act="ignore">Bỏ qua</button>
          </div>
        </div>`;
      container.appendChild(modal);
      modal.querySelector('[data-act="prior"]').addEventListener('click', () => {
        state.selectedCustomerId = c.id;
        c.patience = Math.min(c.maxPatience, c.patience + 30);
        renderCustomers();
        updateTicket();
        playSfx('success');
        toast(`Đã ưu tiên ${c.name}!`);
        close();
      });
      modal.querySelector('[data-act="gift"]').addEventListener('click', () => {
        state.money = Math.max(0, (state.money || 0) - 5000);
        c.patience = Math.min(c.maxPatience, c.patience + 40);
        updateHUD(container, state);
        renderCustomers();
        playSfx('success');
        toast(`Đã tặng quẩy cho ${c.name}!`);
        close();
      });
      modal.querySelector('[data-act="ignore"]').addEventListener('click', () => {
        state.stars = Math.max(0, (state.stars || 0) - 1);
        updateHUD(container, state);
        playSfx('fail');
        toast(`${c.name} giận bỏ đi! -1 sao.`, true);
        close();
      });
    }
  }

  // 3.2: modal đơn app — nhận vào đầu hàng, từ chối thì bỏ qua
  function showAppOrderModal(appOrder) {
    if (appModalOpen || incidentModalOpen || policeModalOpen) return;
    appModalOpen = true;
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    const close = () => { modal.remove(); appModalOpen = false; };
    const servingLines = appOrder.orders
      .map((o, i) => `<p class="name-modal-desc">Suất ${i + 1}: ${shortOrderText(o)}</p>`)
      .join('');
    modal.innerHTML = `
      <div class="name-modal-box">
        <h2>Đơn app mới!</h2>
        <p class="name-modal-desc"><strong>${appOrder.app}</strong> — ${appOrder.shipperName} đến lấy (${appOrder.servings} suất)</p>
        ${servingLines}
        <div class="police-choices">
          <button class="btn-primary police-btn" data-act="accept">Nhận đơn</button>
          <button class="btn-primary police-btn" data-act="decline">Từ chối</button>
        </div>
      </div>`;
    container.appendChild(modal);
    modal.querySelector('[data-act="accept"]').addEventListener('click', () => {
      // 3.2: mỗi suất thành 1 khách app, ưu tiên lên đầu hàng (type shipper tự nhảy đầu)
      const maxPatience = 90 + Math.floor(Math.random() * 30);
      let added = 0;
      for (const order of appOrder.orders) {
        const c = {
          id: appCustomerIdSeq++,
          type: 'shipper',
          name: appOrder.shipperName,
          order,
          bowls: 1,
          patience: maxPatience,
          maxPatience,
          isAppOrder: true, // 3.2
          appName: appOrder.app,
        };
        if (queue.enqueue(c, cooking)) added++;
      }
      playSfx('success');
      if (added > 0) {
        toast(`Đã nhận ${added} suất từ ${appOrder.app}!`);
        renderCustomers();
        updateTicket();
        if (!cooking) startNextDish();
      } else {
        toast('Hàng đầy, không nhận được đơn!', true);
      }
      close();
    });
    modal.querySelector('[data-act="decline"]').addEventListener('click', () => {
      playSfx('click');
      close();
    });
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
  // 3.1a: badge giờ cao điểm
  const peakEl = container.querySelector('#hud-peak');
  if (peakEl) peakEl.hidden = !isPeakHour(parseHour(state.time));

  container.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === (state.currentStep || 0));
    el.classList.toggle('done', i < (state.currentStep || 0));
  });
}
