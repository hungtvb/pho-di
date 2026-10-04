// Phở Đi! - Entry point
// Task 1.1: load config, hiện màn intro

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

  document.getElementById('btn-start')?.addEventListener('click', () => {
    console.log('[Phở Đi!] Bắt đầu chơi (task 1.2 sẽ làm intro đầy đủ)');
    showScreen('screen-counter');
  });
}

main().catch(err => console.error('[Phở Đi!] Lỗi khởi động:', err));
