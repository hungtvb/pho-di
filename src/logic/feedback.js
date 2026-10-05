// Phở Đi! - Task 3.3: Feedback khách hàng sau khi ăn
// Tính mood dựa trên: chất lượng món + thời gian chờ + sự cố

const PHRASES = {
  happy: [
    "Ngon quá! Nước dùng đậm đà!",
    "Phở này ăn là ghiền!",
    "Tuyệt vời! Mai lại đến!",
    "Thịt mềm, bánh dai, chuẩn vị!",
    "Quán này ngon nhất khu!",
    "Nước lèo trong, ngọt xương!",
    "Ăn xong muốn gọi thêm tô nữa!",
    "Rau tươi, thịt nhiều, đáng tiền!",
    "Chủ quán nhiệt tình, phở ngon!",
    "Đậm đà hương vị quê nhà!",
  ],
  neutral: [
    "Cũng được.",
    "Tạm ổn.",
    "Ăn được.",
    "Bình thường.",
    "Không tệ.",
    "Ổn, lần sau thử lại.",
    "Cũng tạm, hơi nhạt.",
    "Được, nhưng chưa xuất sắc.",
  ],
  angry: [
    "Chờ lâu quá!",
    "Thiếu hành mà không nói!",
    "Phở nguội ngắt!",
    "Thịt dai như cao su!",
    "Nước dùng nhạt thếch!",
    "Gọi một đằng, làm một nẻo!",
    "Đợi cả buổi mới có ăn!",
    "Thất vọng quá!",
    "Không bao giờ quay lại!",
    "Tiền mất mà ăn không ngon!",
  ],
};

/**
 * Tính feedback của khách sau khi được phục vụ.
 * @param {Object} opts
 * @param {boolean} opts.perfect - món có đủ nguyên liệu tùy chọn không
 * @param {number} opts.waitRatio - 0 (mới đến) → 1 (sắp bỏ đi)
 * @param {boolean} opts.hadIncident - có sự cố ảnh hưởng không
 * @param {boolean} opts.wrongBowl - có giao nhầm tô không
 * @returns {{mood: 'happy'|'neutral'|'angry', text: string, starDelta: 1|0|-1}}
 */
export function getFeedback({ perfect, waitRatio, hadIncident, wrongBowl }) {
  let score = 0;

  // Chất lượng món
  if (perfect) score += 2;
  else score -= 1;

  // Thời gian chờ
  if (waitRatio > 0.7) score -= 1;      // chờ lâu
  else if (waitRatio < 0.3) score += 1; // phục vụ nhanh

  // Sự cố
  if (hadIncident) score -= 1;

  // Nhầm tô: phạt nặng
  if (wrongBowl) score -= 2;

  let mood, starDelta;
  if (score >= 2) {
    mood = 'happy';
    starDelta = 1;
  } else if (score >= 0) {
    mood = 'neutral';
    starDelta = 0;
  } else {
    mood = 'angry';
    starDelta = -1;
  }

  const phrases = PHRASES[mood];
  const text = phrases[Math.floor(Math.random() * phrases.length)];

  return { mood, text, starDelta };
}

export const FEEDBACK_PHRASES = PHRASES;
