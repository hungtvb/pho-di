// Phở Đi! - Entry point
// Task 1.2: intro scene với background

import { renderIntro } from './scenes/intro.js';

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

async function main() {
  console.log(`[Phở Đi!] v${VERSION} khởi động...`);
  const config = await loadConfig();
  console.log('[Phở Đi!] config đã tải:', config.version);

  const introEl = document.getElementById('screen-intro');
  renderIntro(introEl, () => {
    console.log('[Phở Đi!] Bắt đầu chơi → màn chuẩn bị (task 4.1)');
    showScreen('screen-counter');
  });
}

main().catch(err => console.error('[Phở Đi!] Lỗi khởi động:', err));
