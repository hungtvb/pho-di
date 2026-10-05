// Phở Đi! - Task 3.2: Đơn app + shipper
// Đơn đặt qua app điện thoại (mở khóa ngày 2), shipper đến lấy, ưu tiên đầu hàng.
// Vanilla JS ES module, không phụ thuộc DOM.

import { randomCustomer } from './arrivals.js';

export const APPS = ['PhoFood', 'NgonExpress', 'BepNhanh'];

const APP_SHIPPER_NAMES = [
  'Anh Tốc Độ', 'Chú Phi Nhanh', 'Em Giao Lẹ', 'Bác Chạy Nhanh',
  'Chị Vèo Vèo', 'Anh Gió Lốc',
];

/**
 * Sinh 1 đơn app ngẫu nhiên.
 * @param {number} day - ngày hiện tại (chỉ để log/debug, chưa dùng)
 * @param {string[]} unlockedMeats - meat key món đã mở khóa (Task 4.2)
 * @returns {{app, shipperName, servings, orders: [{meat, toppings}[]]}}
 */
export function randomAppOrder(day, unlockedMeats) {
  const app = APPS[Math.floor(Math.random() * APPS.length)];
  const shipperName = APP_SHIPPER_NAMES[Math.floor(Math.random() * APP_SHIPPER_NAMES.length)];
  const servings = 1 + Math.floor(Math.random() * 3); // 1-3 suất
  // Tái dùng logic sinh order của arrivals.js cho từng suất
  const orders = [];
  for (let i = 0; i < servings; i++) {
    orders.push(randomCustomer(unlockedMeats).order);
  }
  return { app, shipperName, servings, orders };
}

/**
 * Có nên ra đơn app trong giờ này không?
 * Mở khóa từ ngày 2, xác suất ~15%/giờ game.
 */
export function shouldHaveAppOrder(day) {
  if ((day || 1) < 2) return false;
  return Math.random() < 0.15;
}

/**
 * Xác suất bom hàng sau khi giao đơn app: 20%.
 */
export function rollAppCancel() {
  return Math.random() < 0.2;
}

/**
 * Delay (ms) trước khi biết kết quả bom hàng: 6-15s.
 */
export function appCancelDelayMs() {
  return 6000 + Math.floor(Math.random() * 9000);
}
