// Phở Đi! - Scene: Quầy bán chính
// Task 2.1: background quầy + hotspot zones + HUD

import { playSfx } from '../audio.js';

const BG_URL = 'assets/backgrounds/media-generation-bg-quay-pho-0-bf247bf6-5643-45f4-a500-6c0578de05fb.webp';

// 8 bước làm phở
export const STEPS = [
  { id: 'trung',   label: 'Trụng',  icon: '🍜', hotspot: 'noi-trung' },
  { id: 'to',      label: 'Tô',     icon: '🥣', hotspot: 'to' },
  { id: 'nuoc',    label: 'Nước',   icon: '🍲', hotspot: 'noi-nuoc' },
  { id: 'thit',    label: 'Thịt',   icon: '🥩', hotspot: 'khay-thit' },
  { id: 'hanh',    label: 'Hành',   icon: '🌿', hotspot: 'khay-hanh' },
  { id: 'topping', label: 'Topping',icon: '✨', hotspot: 'khay-topping' },
  { id: 'rau',     label: 'Rau',    icon: '🥬', hotspot: 'khay-rau' },
  { id: 'bung',    label: 'Bưng',   icon: '🛎️', hotspot: 'khay-bung' },
];

// Hotspot zones (tọa độ % trên màn hình)
const HOTSPOTS = [
  { id: 'noi-trung',    label: 'Nồi trụng',    x: 12, y: 38, w: 20, h: 16 },
  { id: 'to',           label: 'Tô',           x: 38, y: 38, w: 20, h: 16 },
  { id: 'noi-nuoc',     label: 'Nồi nước dùng',x: 64, y: 38, w: 24, h: 16 },
  { id: 'khay-thit',    label: 'Khay thịt',    x: 8,  y: 58, w: 20, h: 14 },
  { id: 'khay-hanh',    label: 'Khay hành',    x: 32, y: 58, w: 18, h: 14 },
  { id: 'khay-topping', label: 'Topping',      x: 54, y: 58, w: 18, h: 14 },
  { id: 'khay-rau',     label: 'Khay rau',     x: 76, y: 58, w: 18, h: 14 },
  { id: 'khay-bung',    label: 'Bưng ra',      x: 38, y: 76, w: 24, h: 12 },
];

export function renderCounter(container, state, callbacks = {}) {
  const { onHotspot = () => {}, onBack = () => {} } = callbacks;

  container.innerHTML = `
    <div class="counter-bg" style="background-image: url('${BG_URL}')"></div>
    <div class="hud-top">
      <div class="hud-item">🕐 <span id="hud-time">${state.time || '6:00'}</span></div>
      <div class="hud-item">💰 <span id="hud-money">${(state.money || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="hud-item">⭐ <span id="hud-star">${state.stars || 0}</span></div>
      <div class="hud-item">📅 <span id="hud-day">Ngày ${state.day || 1}</span></div>
    </div>
    <div class="hotspot-layer">
      ${HOTSPOTS.map(h => `
        <button class="hotspot" data-id="${h.id}"
          style="left:${h.x}%; top:${h.y}%; width:${h.w}%; height:${h.h}%;"
          title="${h.label}">
          <span class="hotspot-label">${h.label}</span>
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

  container.querySelectorAll('.hotspot').forEach(btn => {
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
