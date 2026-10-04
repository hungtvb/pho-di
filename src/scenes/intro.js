// Phở Đi! - Scene: Màn hình bắt đầu / Intro
// Task 1.2

const BG_URL = 'assets/backgrounds/media-generation-bg-man-bat-dau-0-ea7a2e9e-7fff-4c97-a01b-5b46f48ab859.webp';

export function renderIntro(container, onStart) {
  container.innerHTML = `
    <div class="intro-bg" style="background-image: url('${BG_URL}')"></div>
    <div class="intro-overlay"></div>
    <div class="intro-content">
      <div class="intro-logo">🍜</div>
      <h1 class="intro-title">Phở Đi!</h1>
      <p class="intro-subtitle">Quản lý quán phở của bạn</p>
      <button id="btn-start" class="btn-primary btn-start">Bắt đầu chơi</button>
      <p class="intro-version">v0.1.0</p>
    </div>
  `;

  container.querySelector('#btn-start').addEventListener('click', () => {
    onStart();
  });
}
