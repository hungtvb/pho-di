// Phở Đi! - Task 3.1c: Sự cố ngẫu nhiên
// Vanilla JS ES module, không phụ thuộc DOM

// 5 loại sự cố (Tony duyệt 2026-10-05, bỏ "QR giả")
export const INCIDENT_TYPES = ['no-broth', 'impatient', 'wrong-bowl', 'cancelled', 'spilled'];

// Chỉ 4 loại roll ngẫu nhiên mỗi giờ; 'wrong-bowl' chỉ kích hoạt khi giao sai thịt
export const RANDOM_INCIDENTS = ['no-broth', 'impatient', 'cancelled', 'spilled'];

/**
 * Risk (xác suất) sự cố theo ngày: ngày 1 = 0.3, +0.1/ngày, max 0.8
 * @param {number} day - ngày hiện tại (1-based)
 * @returns {number} xác suất 0..0.8
 */
export function getRisk(day) {
  return Math.min(0.8, 0.3 + (Math.max(1, day) - 1) * 0.1);
}

/**
 * Roll sự cố 1 lần (gọi mỗi giờ game).
 * @param {number} day - ngày hiện tại
 * @returns {string|null} loại sự cố hoặc null
 */
export function rollIncident(day) {
  if (Math.random() >= getRisk(day)) return null;
  return RANDOM_INCIDENTS[Math.floor(Math.random() * RANDOM_INCIDENTS.length)];
}
