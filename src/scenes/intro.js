import { playSfx, toggleMusic, toggleSfx, getSettings } from '../audio.js';

const BG_URL = 'assets/backgrounds/bg-intro-bangten-8k.webp';
const LS_SHOP_NAME = 'pho-di/shop-name';

export function getShopName() {
  return localStorage.getItem(LS_SHOP_NAME) || '';
}

export function setShopName(name) {
  localStorage.setItem(LS_SHOP_NAME, name.trim());
}

export function renderIntro(container, onStart) {
  const s = getSettings();
  const savedName = getShopName();

  container.innerHTML = `
    <div class="intro-bg" style="background-image: url('${BG_URL}')"></div>
    <div class="intro-overlay"></div>
    <div class="signboard-name" id="signboard-name">${savedName ? escapeHtml(savedName) : ''}</div>
    <div class="intro-content">
      <div class="intro-logo">🍜</div>
      <h1 class="intro-title">Phở Đi!</h1>
      ${savedName
        ? `<p class="intro-shop">Quán <strong>${escapeHtml(savedName)}</strong></p>`
        : `<div class="name-input-wrap">
             <input id="input-shop-name" class="name-input" type="text"
               placeholder="Nhập tên quán của bạn..." maxlength="20"
               value="" autocomplete="off">
           </div>`
      }
      <button id="btn-start" class="btn-primary btn-start">Bắt đầu chơi</button>
      <div class="audio-toggles">
        <button id="btn-music" class="toggle-btn" title="Nhạc nền">${s.music ? '🎵' : '🔇'}</button>
        <button id="btn-sfx" class="toggle-btn" title="Âm thanh">${s.sfx ? '🔊' : '🔈'}</button>
      </div>
      <p class="intro-version">v0.1.0</p>
    </div>
  `;

  const input = container.querySelector('#input-shop-name');
  const signboard = container.querySelector('#signboard-name');

  // Live preview tên lên bảng hiệu khi gõ
  if (input) {
    input.addEventListener('input', () => {
      signboard.textContent = input.value;
    });
  }

  container.querySelector('#btn-start').addEventListener('click', () => {
    const name = input ? input.value.trim() : savedName;
    if (name) setShopName(name);
    playSfx('click');
    onStart(name || savedName);
  });

  const btnMusic = container.querySelector('#btn-music');
  const btnSfx = container.querySelector('#btn-sfx');

  btnMusic.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleMusic();
    btnMusic.textContent = on ? '🎵' : '🔇';
    playSfx('click');
  });

  btnSfx.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleSfx();
    btnSfx.textContent = on ? '🔊' : '🔈';
    playSfx('click');
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
