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

export const TAX_RATE = 0.10; // thuế 10% trên doanh thu ngày

export const INGREDIENT_COST = {
  bo: 20000,   // thịt bò
  ga: 15000,   // thịt gà
  quay: 2000,  // quẩy
  trung: 3000, // trứng chần
  gia: 1000,   // giá đỗ
};

// Kho nguyên liệu: tồn kho khởi đầu mỗi loại
export const INITIAL_STOCK = {
  bo: 10,
  ga: 10,
  quay: 10,
  trung: 10,
  gia: 10,
};

// Tên hiển thị nguyên liệu (dùng cho toast "Hết ...")
export const INGREDIENT_NAMES = {
  bo: 'thịt bò',
  ga: 'thịt gà',
  quay: 'quẩy',
  trung: 'trứng',
  gia: 'giá',
};

/**
 * Kiểm tra kho có đủ nguyên liệu cho 1 order không.
 * @param {{meat: string, toppings: string[]}} order
 * @param {object} inventory tồn kho {bo, ga, quay, trung, gia}
 * @returns {{ok: boolean, missing: string[]}} missing = key nguyên liệu thiếu
 */
export function canMakeOrder(order, inventory) {
  const missing = [];
  const inv = inventory || {};
  if (!order) return { ok: true, missing };
  if ((inv[order.meat] || 0) < 1 && !missing.includes(order.meat)) missing.push(order.meat);
  for (const t of (order.toppings || [])) {
    if ((inv[t] || 0) < 1 && !missing.includes(t)) missing.push(t);
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Trừ kho theo order. Gọi sau khi canMakeOrder() trả ok.
 * @param {{meat: string, toppings: string[]}} order
 * @param {object} inventory tồn kho (mutate trực tiếp)
 */
export function consumeOrder(order, inventory) {
  if (!order || !inventory) return;
  inventory[order.meat] = Math.max(0, (inventory[order.meat] || 0) - 1);
  for (const t of (order.toppings || [])) {
    inventory[t] = Math.max(0, (inventory[t] || 0) - 1);
  }
}

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
 * Tính vốn nguyên liệu của 1 order.
 * @param {{meat: string, toppings: string[]}} order
 * @returns {number} tổng vốn (đồng)
 */
export function calcCost(order) {
  if (!order) return 0;
  const meatCost = INGREDIENT_COST[order.meat] || 0;
  const toppingCost = (order.toppings || []).reduce(
    (sum, t) => sum + (INGREDIENT_COST[t] || 0),
    0
  );
  return meatCost + toppingCost;
}

/**
 * Tính thuế trên doanh thu ngày (10%).
 * @param {number} dailyRevenue tổng doanh thu trong ngày
 * @returns {number} tiền thuế (đồng, làm tròn)
 */
export function calcTax(dailyRevenue) {
  return Math.round((dailyRevenue || 0) * TAX_RATE);
}

/**
 * Format số tiền kiểu Việt Nam: 53000 -> "53.000đ"
 */
export function formatVND(n) {
  return `${(n || 0).toLocaleString('vi-VN')}đ`;
}
