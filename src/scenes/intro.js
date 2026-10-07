import { playSfx, toggleMusic, toggleSfx, getSettings } from '../audio.js';

const BG_URL = 'assets/backgrounds/bg-intro-final.webp';
const LS_SHOP_NAME = 'pho-di/shop-name';

export function getShopName() {
  return localStorage.getItem(LS_SHOP_NAME) || '';
}

export function setShopName(name) {
  localStorage.setItem(LS_SHOP_NAME, name.trim());
}

export function renderIntro(container, onStart, opts = {}) {
  const { hasSave = false } = opts;
  const s = getSettings();
  const savedName = getShopName();

  // Task 3.5: nếu có save → 2 nút "Bán tiếp" + "Chơi mới"
  const startButtons = hasSave
    ? `<button id="btn-continue" class="btn-primary btn-start">Bán tiếp</button>
       <button id="btn-new" class="btn-secondary btn-start-new">Chơi mới</button>`
    : `<button id="btn-start" class="btn-primary btn-start">Bắt đầu chơi</button>`;

  container.innerHTML = `
    <div class="intro-bg" style="background-image: url('${BG_URL}')"></div>
        <div class="signboard-name" id="signboard-name">${savedName ? escapeHtml(savedName) : ''}</div>
    <div class="intro-content">
      <div class="intro-logo"><img src="assets/logo-pho-di-final.png" alt="Phở Đi!" class="intro-logo-img"><span class="steam-3" aria-hidden="true"></span></div>
      <h1 class="intro-title" hidden>Phở Đi!</h1>
      ${startButtons}
      <div class="audio-toggles">
        <button id="btn-music" class="toggle-btn" title="Nhạc nền"><img src="${s.music ? 'assets/icons/music-on.webp' : 'assets/icons/music-off.webp'}" class="toggle-icon"></button>
        <button id="btn-sfx" class="toggle-btn" title="Âm thanh"><img src="${s.sfx ? 'assets/icons/sound-on.webp' : 'assets/icons/sound-off.webp'}" class="toggle-icon"></button>
      </div>
      <p class="intro-version">v0.1.0</p>
    </div>
  `;

  // Modal nhập tên quán nếu chưa có
  if (!savedName) {
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
      <div class="name-modal-box">
        <h2>Chào mừng đến với Phở Đi!</h2>
        <p class="name-modal-desc">Hãy đặt tên cho quán phở của bạn để bắt đầu hành trình!</p>
        <input id="modal-shop-name" class="name-input" type="text"
          placeholder="Nhập tên quán..." maxlength="20" autocomplete="off">
        <button id="modal-confirm" class="btn-primary">Bắt đầu</button>
      </div>
    `;
    container.appendChild(modal);
    const modalInput = modal.querySelector('#modal-shop-name');
    const signboard = container.querySelector('#signboard-name');
    modalInput.addEventListener('input', () => {
      signboard.textContent = modalInput.value;
    });
    modal.querySelector('#modal-confirm').addEventListener('click', () => {
      const name = modalInput.value.trim() || 'Quán Phở';
      setShopName(name);
      signboard.textContent = name;
      modal.remove();
      playSfx('click');
    });
    // Focus vào input
    setTimeout(() => modalInput.focus(), 100);
  }

  const signboard = container.querySelector('#signboard-name');

  // Task 3.5: 3 trường hợp nút start
  const btnStart = container.querySelector('#btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      playSfx('click');
      onStart('new');
    });
  }
  const btnContinue = container.querySelector('#btn-continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      playSfx('click');
      onStart('continue');
    });
  }
  const btnNew = container.querySelector('#btn-new');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      playSfx('click');
      onStart('new');
    });
  }

  const btnMusic = container.querySelector('#btn-music');
  const btnSfx = container.querySelector('#btn-sfx');

  btnMusic.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleMusic();
    btnMusic.querySelector('img').src = on ? 'assets/icons/music-on.webp' : 'assets/icons/music-off.webp';
    playSfx('click');
  });

  btnSfx.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleSfx();
    btnSfx.querySelector('img').src = on ? 'assets/icons/sound-on.webp' : 'assets/icons/sound-off.webp';
    playSfx('click');
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
