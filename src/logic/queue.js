// Phở Đi! - Task 2.3b: Hàng đợi khách
// Vanilla JS ES module, không phụ thuộc DOM
// - Tối đa maxSize khách chờ
// - Shipper ưu tiên: nhảy lên đầu hàng (nhưng không cướp món đang nấu dở:
//   nếu dishInProgress thì chèn vào vị trí 1, ngay sau khách đang được nấu)

/**
 * @param {number} maxSize - tối đa khách trong hàng (mặc định 3)
 */
export function createQueue(maxSize = 3) {
  let items = [];

  return {
    /**
     * @param {object} customer
     * @param {boolean} dishInProgress - đang nấu dở cho khách đầu hàng?
     * @returns {boolean} true nếu vào hàng thành công
     */
    enqueue(customer, dishInProgress) {
      if (items.length >= maxSize) return false;
      if (customer.type === 'shipper') {
        const idx = dishInProgress ? 1 : 0;
        items.splice(Math.min(idx, items.length), 0, customer);
      } else {
        items.push(customer);
      }
      return true;
    },

    /** Lấy khách đầu hàng ra (phục vụ xong / bỏ đi) */
    dequeue() {
      return items.shift() || null;
    },

    /** Nhìn khách đầu hàng (không lấy ra) */
    peek() {
      return items[0] || null;
    },

    /** Xóa khách theo id (dùng khi hết kiên nhẫn) */
    removeById(id) {
      const i = items.findIndex(c => c.id === id);
      return i >= 0 ? items.splice(i, 1)[0] : null;
    },

    isFull() {
      return items.length >= maxSize;
    },

    size() {
      return items.length;
    },

    list() {
      return [...items];
    },
  };
}
