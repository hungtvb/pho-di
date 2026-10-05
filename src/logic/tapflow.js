// Phở Đi! - Task 2.2a: State machine 8 bước làm phở
// Vanilla JS ES module, không phụ thuộc DOM

export const STEP_NAMES = [
  'Trụng bánh',   // 0
  'Lấy tô',       // 1
  'Chan nước dùng', // 2
  'Cho thịt',     // 3
  'Hành ngò',     // 4
  'Topping',      // 5
  'Rau thơm',     // 6
  'Bưng ra',      // 7
];

export const TRUNG_DURATION_MS = 3000;

// Trạm nào thuộc bước nào
const STEP_STATIONS = {
  0: ['noi-trung'],
  1: ['to'],
  2: ['noi-nuoc'],
  3: ['khay-thit', 'khay-ga'],
  4: ['khay-hanh'],
  5: ['khay-topping', 'khay-trung', 'khay-gia'],
  6: ['khay-rau'],
  7: ['serve'], // nút "Bưng ra" riêng
};

const MEAT_MAP = {
  'khay-thit': 'bo',
  'khay-ga': 'ga',
};
export const MEAT_NAMES = { bo: 'bò tái', ga: 'gà' };

const TOPPING_MAP = {
  'khay-topping': 'quay',
  'khay-trung': 'trung',
  'khay-gia': 'gia',
};
export const TOPPING_NAMES = { quay: 'quẩy', trung: 'trứng', gia: 'giá' };

// hotspotId -> step (để báo "cần làm X trước" khi chạm sai)
const HOTSPOT_STEP = {};
for (const [step, ids] of Object.entries(STEP_STATIONS)) {
  for (const id of ids) HOTSPOT_STEP[id] = Number(step);
}

function freshDish() {
  return {
    noodle: false,
    bowl: false,
    broth: false,
    meat: null,
    scallion: false,
    toppings: [],
    herbs: false,
  };
}

export function createTapflow() {
  let state = {
    step: 0,
    order: null,
    dish: freshDish(),
    done: false,
    busy: false, // đang trong progress (trụng 3s)
  };

  function startDish(order) {
    state = {
      step: 0,
      order: { meat: order.meat, toppings: [...(order.toppings || [])] },
      dish: freshDish(),
      done: false,
      busy: false,
    };
    return snapshot();
  }

  function snapshot() {
    return {
      step: state.step,
      done: state.done,
      busy: state.busy,
      dish: { ...state.dish, toppings: [...state.dish.toppings] },
      order: state.order ? { meat: state.order.meat, toppings: [...state.order.toppings] } : null,
    };
  }

  // Hoàn tất progress của bước trụng (UI gọi sau khi hết 3s)
  function completeProgress() {
    if (!state.busy || state.step !== 0) {
      return { valid: false, message: 'Không có tiến trình nào đang chạy.', state: snapshot() };
    }
    state.busy = false;
    state.dish.noodle = true;
    state.step = 1;
    return { valid: true, message: 'Trụng bánh xong!', state: snapshot() };
  }

  function tap(hotspotId) {
    if (state.done) {
      return { valid: false, message: 'Tô phở đã xong rồi!', state: snapshot() };
    }
    if (state.busy) {
      return { valid: false, message: 'Đang trụng bánh, chờ chút...', state: snapshot() };
    }
    if (!state.order) {
      return { valid: false, message: 'Chưa có order nào.', state: snapshot() };
    }

    const expected = STEP_STATIONS[state.step] || [];
    if (!expected.includes(hotspotId)) {
      const actualStep = HOTSPOT_STEP[hotspotId];
      if (actualStep !== undefined && actualStep !== state.step) {
        return {
          valid: false,
          message: `Cần làm "${STEP_NAMES[state.step]}" trước!`,
          state: snapshot(),
        };
      }
      return { valid: false, message: 'Chạm nhầm chỗ rồi!', state: snapshot() };
    }

    // --- Validate theo từng bước ---
    if (state.step === 0) {
      // Trụng: bắt đầu progress 3s, UI đếm rồi gọi completeProgress()
      state.busy = true;
      return {
        valid: true,
        message: 'Đang trụng bánh...',
        progress: TRUNG_DURATION_MS,
        state: snapshot(),
      };
    }

    if (state.step === 3) {
      const meat = MEAT_MAP[hotspotId];
      if (meat !== state.order.meat) {
        return {
          valid: false,
          message: `Khách gọi phở ${MEAT_NAMES[state.order.meat]}, không phải ${MEAT_NAMES[meat]}!`,
          state: snapshot(),
        };
      }
      state.dish.meat = meat;
      state.step = 4;
      return { valid: true, message: `Đã cho thịt ${MEAT_NAMES[meat]}!`, state: snapshot() };
    }

    if (state.step === 5) {
      const topping = TOPPING_MAP[hotspotId];
      if (!state.order.toppings.includes(topping)) {
        return {
          valid: false,
          message: `Khách không gọi ${TOPPING_NAMES[topping]}!`,
          state: snapshot(),
        };
      }
      if (state.dish.toppings.includes(topping)) {
        return {
          valid: false,
          message: `${TOPPING_NAMES[topping]} đã cho rồi!`,
          state: snapshot(),
        };
      }
      state.dish.toppings.push(topping);
      const need = state.order.toppings.filter(t => !state.dish.toppings.includes(t));
      if (need.length === 0) {
        state.step = 6;
        return { valid: true, message: 'Đủ topping!', state: snapshot() };
      }
      return {
        valid: true,
        message: `Đã cho ${TOPPING_NAMES[topping]}! Còn: ${need.map(t => TOPPING_NAMES[t]).join(', ')}`,
        state: snapshot(),
      };
    }

    if (state.step === 7) {
      // Bưng ra: validate toàn bộ
      const d = state.dish;
      const missing = [];
      if (!d.noodle) missing.push(STEP_NAMES[0]);
      if (!d.bowl) missing.push(STEP_NAMES[1]);
      if (!d.broth) missing.push(STEP_NAMES[2]);
      if (!d.meat) missing.push(STEP_NAMES[3]);
      if (!d.scallion) missing.push(STEP_NAMES[4]);
      if (!d.herbs) missing.push(STEP_NAMES[6]);
      if (missing.length > 0) {
        return { valid: false, message: `Còn thiếu: ${missing.join(', ')}!`, state: snapshot() };
      }
      state.done = true;
      return { valid: true, message: 'Bưng ra phục vụ! 🍜', done: true, state: snapshot() };
    }

    // Các bước đơn giản: 1 (tô), 2 (nước), 4 (hành), 6 (rau)
    if (state.step === 1) state.dish.bowl = true;
    if (state.step === 2) state.dish.broth = true;
    if (state.step === 4) {
      state.dish.scallion = true;
      // Order không gọi topping → bỏ qua bước 5
      if (state.order.toppings.length === 0) {
        state.step = 6;
        return { valid: true, message: 'Xong "Hành ngò"! (bỏ qua topping)', state: snapshot() };
      }
    }
    if (state.step === 6) state.dish.herbs = true;
    const finishedStep = state.step;
    state.step = finishedStep + 1;
    return { valid: true, message: `Xong "${STEP_NAMES[finishedStep]}"!`, state: snapshot() };
  }

  return { startDish, tap, completeProgress, getState: snapshot, STEP_NAMES };
}
