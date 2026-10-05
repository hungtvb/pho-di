// Phở Đi! - Task 2.3b: Khách đến (Poisson arrival) + sinh khách ngẫu nhiên
// Vanilla JS ES module, không phụ thuộc DOM

const TYPES = ['ong-gia', 'co-gai', 'shipper', 'ba-cu'];

const NAMES = {
  'ong-gia': ['Ông Sáu', 'Ông Ba', 'Ông Hai', 'Bác Năm', 'Chú Bảy', 'Ông Mười'],
  'co-gai': ['Chị Mai', 'Cô Lan', 'Em Ngọc', 'Chị Hoa', 'Cô Trinh', 'Bé An'],
  'shipper': ['Anh Ship', 'Chú Giao', 'Em Tốc', 'Anh Nhanh', 'Chú Gió', 'Em Lẹ'],
  'ba-cu': ['Bà Tám', 'Bà Tư', 'Bà Sáu', 'Cụ Năm', 'Bà Chín', 'Mẹ Mười'],
};

const MEATS = ['bo', 'ga'];
const TOPPINGS = ['quay', 'trung', 'gia'];

let nextId = 1;

/**
 * Sinh 1 khách ngẫu nhiên.
 * @returns {{id, type, name, order: {meat, toppings[]}, bowls, patience, maxPatience}}
 */
export function randomCustomer() {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const names = NAMES[type];
  const meat = MEATS[Math.floor(Math.random() * MEATS.length)];

  // 0-2 topping ngẫu nhiên
  const nTop = Math.floor(Math.random() * 3);
  const shuffled = [...TOPPINGS].sort(() => Math.random() - 0.5);
  const toppings = shuffled.slice(0, nTop);

  // Shipper vội hơn (60-85s), khách thường 80-115s
  const maxPatience = type === 'shipper'
    ? 60 + Math.floor(Math.random() * 26)
    : 80 + Math.floor(Math.random() * 36);

  return {
    id: nextId++,
    type,
    name: names[Math.floor(Math.random() * names.length)],
    order: { meat, toppings },
    bowls: 1, // task 2.3: 1 tô (mở rộng 1-3 tô sau)
    patience: maxPatience,
    maxPatience,
  };
}

export function isPeakHour(hour) {
  return (hour >= 7 && hour < 11) || (hour >= 18 && hour < 20);
}

/**
 * Khoảng thời gian (ms) đến lượt khách tiếp theo — Poisson process
 * (inter-arrival ~ exponential). λ tăng theo sao, giờ cao điểm đông hơn.
 * @param {number} stars - số sao hiện tại
 * @param {number} hour - giờ game (0-23)
 * @returns {number} ms
 */
export function nextArrivalInterval(stars, hour) {
  let mean = Math.max(8, 26 - (stars || 0) * 2); // giây trung bình
  if (isPeakHour(hour)) mean *= 0.5;
  else if (hour < 6 || hour >= 21) mean *= 1.6;
  const u = Math.random();
  const sec = -Math.log(1 - u) * mean;
  return Math.max(3000, Math.round(sec * 1000));
}

/** Parse "6:00" → 6 */
export function parseHour(timeStr) {
  const m = /^(\d{1,2})/.exec(timeStr || '');
  return m ? parseInt(m[1], 10) : 6;
}

export const CUSTOMER_TYPES = TYPES;
