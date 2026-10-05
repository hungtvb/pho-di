// Phở Đi! - Entry point
// Task 1.2: intro scene với background

import { renderIntro } from './scenes/intro.js';
import { renderCounter } from './scenes/counter.js';
import { unlockAudio, playMusic, playSfx, toggleMusic, toggleSfx, getSettings } from './audio.js';
import { saveGame, loadGame, clearSave, hasSave, applySave } from './logic/save.js'; // Task 3.5
import { INITIAL_STOCK } from './logic/economy.js'; // Kho nguyên liệu

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
    dailyCost: 0, // vốn nguyên liệu đã dùng trong ngày (Task 2.4d)
    dailyRevenue: 0, // doanh thu trong ngày để tính thuế 10% cuối ngày
    inventory: { ...INITIAL_STOCK }, // tồn kho nguyên liệu
    ownedPremises: false, // Task 4.2: đã mua mặt bằng → miễn công an
    unlockedMeats: [], // Task 4.2: meat key món đã mở khóa (tai, nam)
    minigameBuff: null, // Task 4.1: { day, pct } buff +5% tiền bán trong ngày
    lastMinigame: null, // Task 4.1: { id, day } lần chơi minigame gần nhất
    stats: {
      happy: 0, neutral: 0, angry: 0, // thống kê feedback (Task 3.3)
      // Task 3.4: huy hiệu + thử thách
      bowlsServed: 0, totalEarned: 0, daysPlayed: 1, perfectStreak: 0,
      dailyGa: 0, dailyEarned: 0, dailyLeft: 0, dailyServed: 0,
      dailyPerfect: 0, dailyHappy: 0,
      badges: [], challengeDay: 0, challenges: [], challengeDone: [],
    },
  };

  // Task 3.5: kiểm tra có save không để hiện nút "Bán tiếp"
  const existingSave = hasSave();

  // Auto-save mỗi 5s + khi rời trang (Task 3.5)
  let saveTimer = null;
  function startAutoSave() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => saveGame(gameState), 5000);
  }
  window.addEventListener('beforeunload', () => saveGame(gameState));

  async function enterCounter(opts = {}) {
    const { fromSave = false, newGame = false } = opts;
    console.log('[Phở Đi!] Vào quầy:', fromSave ? 'tiếp tục save' : 'chơi mới');
    playSfx('click');

    if (newGame) clearSave();

    // Task 3.5: load save nếu tiếp tục
    let paused = false;
    if (fromSave) {
      const data = loadGame();
      if (data) {
        applySave(gameState, data);
        paused = true; // tạm dừng, chờ user bấm "Bán tiếp"
      }
    }

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
    // Xóa nội dung quầy cũ (tránh render chồng khi chơi lại)
    counterEl.innerHTML = '';
    renderCounter(counterEl, gameState, {
      onHotspot: (id) => {
        console.log('[Phở Đi!] chạm hotspot:', id, '(tapflow ở task 2.2)');
      },
      onBack: () => {
        saveGame(gameState); // Task 3.5: lưu khi về intro
        showScreen('screen-intro');
        // Vẽ lại intro để cập nhật nút Bán tiếp
        renderIntro(introEl, handleIntroStart, { hasSave: hasSave() });
      },
      paused,
    });
    showScreen('screen-counter');
    startAutoSave();
  }

  function handleIntroStart(action) {
    // action: 'new' | 'continue'
    if (action === 'continue') enterCounter({ fromSave: true });
    else enterCounter({ newGame: action === 'new' && hasSave() });
  }

  renderIntro(introEl, handleIntroStart, { hasSave: existingSave });
}

main().catch(err => console.error('[Phở Đi!] Lỗi khởi động:', err));
