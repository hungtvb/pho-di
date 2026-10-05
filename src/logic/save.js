// Phở Đi! - Save/load (Task 3.5)
// Lưu tiến trình game vào localStorage, key có version để migrate sau này.

import { INITIAL_STOCK } from './economy.js';

const SAVE_KEY = 'pho-di/v1';
const CURRENT_VERSION = 1;

// Những field được lưu (không lưu queue/timer/modal — khi load, queue trống)
const SAVE_FIELDS = ['money', 'stars', 'day', 'time', 'dailyCost', 'dailyRevenue', 'stats', 'inventory'];

/**
 * Lưu state game vào localStorage.
 * @param {object} state - gameState
 * @returns {boolean} true nếu lưu thành công
 */
export function saveGame(state) {
  try {
    const data = {
      version: CURRENT_VERSION,
      savedAt: Date.now(),
    };
    for (const f of SAVE_FIELDS) {
      if (state[f] !== undefined) data[f] = state[f];
    }
    // Tên quán + cài đặt âm thanh (đã có key riêng, lưu kèm cho đồng bộ)
    try {
      data.shopName = localStorage.getItem('pho-di/shop-name') || '';
      const audio = localStorage.getItem('pho-di/audio');
      if (audio) data.audio = JSON.parse(audio);
    } catch {}
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    // localStorage đầy hoặc bị chặn (private mode)
    console.warn('[Phở Đi!] Không lưu được game:', err);
    return false;
  }
}

/**
 * Đọc save. Validate cơ bản, corrupt → null.
 * @returns {object|null} save data hoặc null
 */
export function loadGame() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn('[Phở Đi!] Save bị hỏng, bỏ qua.');
    return null;
  }
  if (!data || typeof data !== 'object' || data.version !== CURRENT_VERSION) {
    return null;
  }
  // Validate các field số cơ bản
  if (typeof data.money !== 'number' || typeof data.day !== 'number' || data.day < 1) {
    console.warn('[Phở Đi!] Save không hợp lệ, bỏ qua.');
    return null;
  }
  return data;
}

/** Kiểm tra có save không (không parse). */
export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

/** Xóa save. */
export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

/**
 * Ghi đè các field của gameState từ save data.
 * Không động vào queue/timer/modal — màn quầy tự khởi tạo trống.
 */
export function applySave(state, data) {
  for (const f of SAVE_FIELDS) {
    if (data[f] !== undefined) state[f] = data[f];
  }
  // Đảm bảo stats có đủ field mới (save cũ thiếu field)
  if (state.stats && typeof state.stats === 'object') {
    const defaults = {
      happy: 0, neutral: 0, angry: 0,
      bowlsServed: 0, totalEarned: 0, daysPlayed: 1, perfectStreak: 0,
      dailyGa: 0, dailyEarned: 0, dailyLeft: 0, dailyServed: 0,
      dailyPerfect: 0, dailyHappy: 0,
      badges: [], challengeDay: 0, challenges: [], challengeDone: [],
    };
    for (const k of Object.keys(defaults)) {
      if (state.stats[k] === undefined) state.stats[k] = defaults[k];
    }
  }
  // Kho nguyên liệu: save cũ không có → dùng tồn kho khởi đầu
  if (!state.inventory || typeof state.inventory !== 'object') {
    state.inventory = { ...INITIAL_STOCK };
  } else {
    for (const k of Object.keys(INITIAL_STOCK)) {
      if (typeof state.inventory[k] !== 'number') state.inventory[k] = INITIAL_STOCK[k];
    }
  }
}
