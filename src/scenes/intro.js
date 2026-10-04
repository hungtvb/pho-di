// Phở Đi! - Scene: Màn hình bắt đầu / Intro
// Task 1.2

import { playSfx, toggleMusic, toggleSfx, getSettings } from '../audio.js';

const BG_URL = 'assets/backgrounds/media-generation-bg-man-bat-dau-0-ea7a2e9e-7fff-4c97-a01b-5b46f48ab859.webp';

export function renderIntro(container, onStart) {
  const s = getSettings();
  container.innerHTML = `
    <div class="intro-bg" style="background-image: url('${BG_URL}')"></div>
    <div class="intro-overlay"></div>
    <div class="intro-content">
      <div class="intro-logo">🍜</div>
      <h1 class="intro-title">Phở Đi!</h1>
      <p class="intro-subtitle">Quản lý quán phở của bạn</p>
      <button id="btn-start" class="btn-primary btn-start">Bắt đầu chơi</button>
      <div class="audio-toggles">
        <button id="btn-music" class="toggle-btn" title="Nhạc nền">${s.music ? '🎵' : '🔇'}</button>
        <button id="btn-sfx" class="toggle-btn" title="Âm thanh">${s.sfx ? '🔊' : '🔈'}</button>
      </div>
      <p class="intro-version">v0.1.0</p>
    </div>
  `;

  container.querySelector('#btn-start').addEventListener('click', () => {
    playSfx('click');
    onStart();
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
