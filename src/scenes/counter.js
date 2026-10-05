// Phở Đi! - Scene: Quầy bán chính (v2)
// Background CSS + sprite, không dùng ảnh AI

import { playSfx } from '../audio.js';
import { createTapflow, STEP_NAMES, MEAT_NAMES, TOPPING_NAMES, TRUNG_DURATION_MS } from '../logic/tapflow.js';

// 8 bước làm phở
export const STEPS = [
  { id: 'trung',   label: 'Trụng',   icon: '🍜' },
  { id: 'to',      label: 'Tô',      icon: '🥣' },
  { id: 'nuoc',    label: 'Nước',    icon: '🍲' },
  { id: 'thit',    label: 'Thịt',    icon: '🥩' },
  { id: 'hanh',    label: 'Hành',    icon: '🌿' },
  { id: 'topping', label: 'Topping', icon: '✨' },
  { id: 'rau',     label: 'Rau',     icon: '🥬' },
  { id: 'bung',    label: 'Bưng',    icon: '🛎️' },
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

  // Task 2.2: tapflow 8 bước — order mẫu (task 2.3 sẽ có khách gọi món thật)
  const DEMO_ORDER = { meat: 'bo', toppings: ['quay', 'trung'] };
  const flow = createTapflow();
  flow.startDish(DEMO_ORDER);

  const orderText = () => {
    const o = flow.getState().order;
    const tops = o.toppings.map(t => TOPPING_NAMES[t]).join(' + ') || 'không topping';
    return `Phở ${MEAT_NAMES[o.meat]} + ${tops}`;
  };

  container.innerHTML = `
    <div class="counter-bg-css"></div>
    <div class="hud-top">
      <button id="btn-counter-back" class="btn-back-hud">←</button>
      <div class="hud-item">🕐 <span id="hud-time">${state.time || '6:00'}</span></div>
      <div class="hud-item">💰 <span id="hud-money">${(state.money || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="hud-item">⭐ <span id="hud-star">${state.stars || 0}</span></div>
      <div class="hud-item">📅 <span id="hud-day">Ngày ${state.day || 1}</span></div>
    </div>
    <div class="order-ticket">🧾 <span id="order-text">${orderText()}</span></div>
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
      <button class="btn-serve" id="btn-serve">🛎️ Bưng ra phục vụ!</button>
    </div>
    <div class="toast" id="toast" hidden></div>
    <div class="hud-steps">
      ${STEPS.map((s, i) => `
        <div class="step" data-step="${i}">
          <span class="step-icon">${s.icon}</span>
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
    el.textContent = msg;
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
    container.querySelector('#serve-overlay').hidden = step !== 7;
  }

  function runTrungProgress(btn) {
    btn.classList.add('progressing');
    playSfx('pop');
    // Lưu timeoutId để clear khi unmount; check isConnected tránh race khi bấm back
    const tid = setTimeout(() => {
      if (!container.isConnected) return;
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
      // Xong 1 tô → cộng tiền demo, làm tô mới
      state.money = (state.money || 0) + 45000;
      updateHUD(container, state);
      setTimeout(() => {
        flow.startDish(DEMO_ORDER);
        container.querySelector('#order-text').textContent = orderText();
        syncSteps();
        toast('Order mới: ' + orderText());
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
    onBack();
  });

  toast('Order mới: ' + orderText());
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
