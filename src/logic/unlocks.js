// Phở Đi! - Task 4.2: Mở khóa món mới + nâng cấp quán
// Món mới là loại thịt mới (key trong MEAT_PRICES / INGREDIENT_COST):
//  - tai: Phở tái (ngày 3 + 5 sao) — giá 48k, vốn 22k
//  - nam: Phở nạm (ngày 5 + 10 sao) — giá 50k, vốn 25k

export const MEAT_META = {
  tai: {
    name: 'Phở tái', meatName: 'tái', label: 'Thịt tái', ingredientName: 'thịt tái',
    price: 48000, cost: 22000,
    stationId: 'khay-tai', sprite: 'assets/sprites/thit-bo-tai-v2.webp',
  },
  nam: {
    name: 'Phở nạm', meatName: 'nạm', label: 'Thịt nạm', ingredientName: 'thịt nạm',
    price: 50000, cost: 25000,
    stationId: 'khay-nam', sprite: 'assets/sprites/thit-bo-tai-v2.webp',
  },
};

// Điều kiện mở khóa từng món
export const UNLOCKS = [
  { id: 'tai', reqDay: 3, reqStars: 5 },
  { id: 'nam', reqDay: 5, reqStars: 10 },
];

/**
 * Trả về các món mới đủ điều kiện mở (chưa có trong unlockedIds).
 * @param {number} day - ngày hiện tại
 * @param {number} stars - số sao hiện tại
 * @param {string[]} unlockedIds - mảng meat key đã mở
 * @returns {object[]} mảng {id, reqDay, reqStars, ...MEAT_META}
 */
export function checkNewUnlocks(day, stars, unlockedIds) {
  const unlocked = new Set(unlockedIds || []);
  return UNLOCKS
    .filter(u => !unlocked.has(u.id) && (day || 1) >= u.reqDay && (stars || 0) >= u.reqStars)
    .map(u => ({ ...u, ...MEAT_META[u.id] }));
}

/**
 * Danh sách meat key được phép xuất hiện trong order (bo, ga + món đã mở).
 */
export function getAvailableMeats(unlockedMeats) {
  const extra = (unlockedMeats || []).filter(m => MEAT_META[m]);
  return ['bo', 'ga', ...extra];
}

// Nguyên liệu cơ bản luôn bán ở chợ
export const BASE_MARKET_ITEMS = ['bo', 'ga', 'quay', 'trung', 'gia'];

/**
 * Danh sách nguyên liệu bán ở chợ (cơ bản + thịt của món đã mở khóa).
 */
export function getMarketItems(unlockedMeats) {
  const extra = (unlockedMeats || []).filter(m => MEAT_META[m]);
  return [...BASE_MARKET_ITEMS, ...extra];
}

// Giá mua mặt bằng — sở hữu rồi thì miễn công an kiểm tra
export const PREMISES_PRICE = 500000;
