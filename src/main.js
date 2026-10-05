// Phở Đi! - Entry point
// Task 1.2: intro scene với background

import { renderIntro } from './scenes/intro.js';
import { renderCounter } from './scenes/counter.js';
import { unlockAudio, playMusic, playSfx, toggleMusic, toggleSfx, getSettings } from './audio.js';

const VERSION = '0.1.0';

async function loadConfig() {
  const res = await fetch('src/config.json');
  if (!res.ok) throw new Error('Không tải được config.json');
  return res.json();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// Preload ảnh quan trọng trước khi hiện intro
function preloadImages(urls) {
  return Promise.all(urls.map(url => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
  })));
}

const CRITICAL_ASSETS = [
  'assets/logo-pho.webp',
  'assets/backgrounds/bg-intro-final.webp',
  'assets/icons/music-on.webp',
  'assets/icons/music-off.webp',
  'assets/icons/sound-on.webp',
  'assets/icons/sound-off.webp',
  'assets/icons/back.webp',
  'assets/icons/bell.webp',
  'assets/icons/star.webp',
];

// Ảnh màn chơi (preload khi bấm Bắt đầu chơi)
const COUNTER_ASSETS = [
  'assets/backgrounds/bg-counter.webp',
  'assets/sprites/banh-pho-v2.webp',
  'assets/sprites/noi-nuoc-dung-v2.webp',
  'assets/sprites/to-pho-v2.webp',
  'assets/sprites/thit-bo-tai-v2.webp',
  'assets/sprites/thit-ga-v2.webp',
  'assets/sprites/hanh-ngo-v2.webp',
  'assets/sprites/rau-thom-v2.webp',
  'assets/sprites/quay-v2.webp',
  'assets/sprites/trung-chan-v2.webp',
  'assets/sprites/gia-do-v2.webp',
  'assets/sprites/ong-gia-v2.webp',
  'assets/sprites/co-gai-v2.webp',
  'assets/sprites/shipper-v2.webp',
  'assets/sprites/ba-cu-v2.webp',
  'assets/icons/steps/trung.webp',
  'assets/icons/steps/to.webp',
  'assets/icons/steps/nuoc.webp',
  'assets/icons/steps/thit.webp',
  'assets/icons/steps/hanh.webp',
  'assets/icons/steps/topping.webp',
  'assets/icons/steps/rau.webp',
  'assets/icons/steps/bung.webp',
];

async function main() {
  console.log(`[Phở Đi!] v${VERSION} khởi động...`);

  // Hiện loading
  const loadingEl = document.getElementById('screen-loading');
  if (loadingEl) loadingEl.classList.add('active');

  const config = await loadConfig();
  console.log('[Phở Đi!] config đã tải:', config.version);

  // Preload ảnh quan trọng
  await preloadImages(CRITICAL_ASSETS);
  console.log('[Phở Đi!] ảnh đã preload xong');

  if (loadingEl) loadingEl.classList.remove('active');

  const introEl = document.getElementById('screen-intro');
  const counterEl = document.getElementById('screen-counter');
  unlockAudio(); // fix iOS: mở khóa audio ở lần chạm đầu
  showScreen('screen-intro'); // hiện intro sau khi load xong

  // Game state đơn giản (task 2.4 sẽ mở rộng)
  const gameState = {
    money: config.startMoney || 500000,
    stars: 0,
    day: 1,
    time: '6:00',
    currentStep: 0,
  };

  renderIntro(introEl, async () => {
    console.log('[Phở Đi!] Bắt đầu chơi → preload màn quầy');
    playSfx('click');

    // Hiện loading khi sang màn chơi
    const loadingEl = document.getElementById('screen-loading');
    if (loadingEl) {
      loadingEl.querySelector('p').textContent = 'Đang chuẩn bị quán...';
      loadingEl.classList.add('active');
    }
    await preloadImages(COUNTER_ASSETS);
    console.log('[Phở Đi!] ảnh màn quầy đã preload xong');
    if (loadingEl) {
      loadingEl.classList.remove('active');
      loadingEl.querySelector('p').textContent = 'Đang tải...';
    }

    playMusic();
    renderCounter(counterEl, gameState, {
      onHotspot: (id) => {
        console.log('[Phở Đi!] chạm hotspot:', id, '(tapflow ở task 2.2)');
      },
      onBack: () => showScreen('screen-intro'),
    });
    showScreen('screen-counter');
  });
}

main().catch(err => console.error('[Phở Đi!] Lỗi khởi động:', err));
