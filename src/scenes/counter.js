// Phở Đi! - Scene: Quầy bán chính (v2)
// Background CSS + sprite, không dùng ảnh AI

import { playSfx } from '../audio.js';

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
const STATIONS = [
  {
    id: 'noi-trung', label: 'Trụng bánh',
    sprite: 'assets/sprites/media-generation-banh-pho-0-1f411459-2669-4538-9dc1-9401654d8d30-std.webp',
    x: 8, y: 30, w: 26,
  },
  {
    id: 'noi-nuoc', label: 'Nước dùng',
    sprite: 'assets/sprites/media-generation-noi-nuoc-dung-0-9de6b8ae-69bd-46f6-8128-28ce5a2acf48-std.webp',
    x: 38, y: 28, w: 28,
  },
  {
    id: 'to', label: 'Tô',
    sprite: 'assets/sprites/media-generation-to-pho-0-70c9e458-f18d-40cc-8741-6713dbb89a2b-std.webp',
    x: 70, y: 30, w: 24,
  },
  {
    id: 'khay-thit', label: 'Thịt bò',
    sprite: 'assets/sprites/media-generation-thit-bo-tai-0-7b11bcd4-0c16-465b-ab0c-d9a2e3700931-std.webp',
    x: 6, y: 52, w: 22,
  },
  {
    id: 'khay-ga', label: 'Thịt gà',
    sprite: 'assets/sprites/media-generation-thit-ga-0-5383b095-817f-4f66-a955-eb4069c87a87-std.webp',
    x: 30, y: 52, w: 22,
  },
  {
    id: 'khay-hanh', label: 'Hành ngò',
    sprite: 'assets/sprites/media-generation-hanh-ngo-0-a65ebdf2-4dad-4f55-b2a2-1e8d88ae26d8-std.webp',
    x: 54, y: 52, w: 20,
  },
  {
    id: 'khay-rau', label: 'Rau thơm',
    sprite: 'assets/sprites/media-generation-rau-thom-0-c22d5f32-04b3-476a-8c15-62080123353c-std.webp',
    x: 76, y: 52, w: 20,
  },
  {
    id: 'khay-topping', label: 'Topping',
    sprite: 'assets/sprites/media-generation-quay-0-3dc1c407-35bc-44ff-84cb-ffbc5f437ff2-std.webp',
    x: 18, y: 70, w: 20,
  },
  {
    id: 'khay-trung', label: 'Trứng',
    sprite: 'assets/sprites/media-generation-trung-chan-0-822707a4-97c2-4c10-b3f4-b9d8ecd9c655-std.webp',
    x: 42, y: 70, w: 18,
  },
  {
    id: 'khay-gia', label: 'Giá',
    sprite: 'assets/sprites/media-generation-gia-do-0-a7f39c46-5e9d-458b-a64f-c4b7aadefe0d-std.webp',
    x: 64, y: 70, w: 18,
  },
];

export function renderCounter(container, state, callbacks = {}) {
  const { onHotspot = () => {}, onBack = () => {} } = callbacks;

  container.innerHTML = `
    <div class="counter-bg-css"></div>
    <div class="hud-top">
      <div class="hud-item">🕐 <span id="hud-time">${state.time || '6:00'}</span></div>
      <div class="hud-item">💰 <span id="hud-money">${(state.money || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="hud-item">⭐ <span id="hud-star">${state.stars || 0}</span></div>
      <div class="hud-item">📅 <span id="hud-day">Ngày ${state.day || 1}</span></div>
    </div>
    <div class="station-layer">
      ${STATIONS.map(s => `
        <button class="station" data-id="${s.id}"
          style="left:${s.x}%; top:${s.y}%; width:${s.w}%;">
          <img src="${s.sprite}" alt="${s.label}" draggable="false">
          <span class="station-label">${s.label}</span>
        </button>
      `).join('')}
    </div>
    <div class="hud-steps">
      ${STEPS.map((s, i) => `
        <div class="step ${i === (state.currentStep || 0) ? 'active' : ''} ${i < (state.currentStep || 0) ? 'done' : ''}" data-step="${i}">
          <span class="step-icon">${s.icon}</span>
          <span class="step-label">${s.label}</span>
        </div>
      `).join('')}
    </div>
    <button id="btn-counter-back" class="btn-back">←</button>
  `;

  container.querySelectorAll('.station').forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('pop');
      btn.classList.add('tapped');
      setTimeout(() => btn.classList.remove('tapped'), 200);
      onHotspot(btn.dataset.id);
    });
  });

  container.querySelector('#btn-counter-back').addEventListener('click', () => {
    playSfx('click');
    onBack();
  });
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
