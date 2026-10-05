// Phở Đi! - Logic kinh tế (Task 2.4a)
// Bảng giá món + topping, tính tiền order

export const MEAT_PRICES = {
  bo: 45000, // phở bò tái
  ga: 40000, // phở gà
};

export const TOPPING_PRICES = {
  quay: 5000,  // quẩy
  trung: 8000, // trứng chần
  gia: 3000,   // giá đỗ
};

export const DAILY_RENT = 50000; // chi phí mặt bằng mỗi ngày

/**
 * Tính tổng tiền của 1 order.
 * @param {{meat: string, toppings: string[]}} order
 * @returns {number} tổng tiền (đồng)
 */
export function calcPrice(order) {
  if (!order) return 0;
  const meatPrice = MEAT_PRICES[order.meat] || 0;
  const toppingPrice = (order.toppings || []).reduce(
    (sum, t) => sum + (TOPPING_PRICES[t] || 0),
    0
  );
  return meatPrice + toppingPrice;
}

/**
 * Format số tiền kiểu Việt Nam: 53000 -> "53.000đ"
 */
export function formatVND(n) {
  return `${(n || 0).toLocaleString('vi-VN')}đ`;
}
