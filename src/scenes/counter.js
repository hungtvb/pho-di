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
    sprite: 'assets/sprites/media-generation-banh-pho-v2.webp',
    x: 8, y: 30, w: 26,
  },
  {
    id: 'noi-nuoc', label: 'Nước dùng',
    sprite: 'assets/sprites/media-generation-noi-nuoc-dung-v2.webp',
    x: 38, y: 28, w: 28,
  },
  {
    id: 'to', label: 'Tô',
    sprite: 'assets/sprites/media-generation-to-pho-v2.webp',
    x: 70, y: 30, w: 24,
  },
  {
    id: 'khay-thit', label: 'Thịt bò',
    sprite: 'assets/sprites/media-generation-thit-bo-tai-v2.webp',
    x: 6, y: 52, w: 22,
  },
  {
    id: 'khay-ga', label: 'Thịt gà',
    sprite: 'assets/sprites/media-generation-thit-ga-v2.webp',
    x: 30, y: 52, w: 22,
  },
  {
    id: 'khay-hanh', label: 'Hành ngò',
    sprite: 'assets/sprites/media-generation-hanh-ngo-v2.webp',
    x: 54, y: 52, w: 20,
  },
  {
    id: 'khay-rau', label: 'Rau thơm',
    sprite: 'assets/sprites/media-generation-rau-thom-v2.webp',
    x: 76, y: 52, w: 20,
  },
  {
    id: 'khay-topping', label: 'Topping',
    sprite: 'assets/sprites/media-generation-quay-v2.webp',
    x: 18, y: 70, w: 20,
  },
  {
    id: 'khay-trung', label: 'Trứng',
    sprite: 'assets/sprites/media-generation-trung-chan-v2.webp',
    x: 42, y: 70, w: 18,
  },
  {
    id: 'khay-gia', label: 'Giá',
    sprite: 'assets/sprites/media-generation-gia-do-v2.webp',
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
