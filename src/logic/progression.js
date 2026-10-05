// Phở Đi! - Task 3.4: Huy hiệu + Thử thách
// Huy hiệu: mở khóa khi đạt điều kiện, có thưởng tiền
// Thử thách hàng ngày: 3 thử thách/ngày, random ổn định theo ngày

export const BADGES = [
  { id: 'newbie',    name: 'Tân binh',     desc: 'Bán 10 tô phở',          check: (s) => (s.bowlsServed || 0) >= 10,  reward: 50000 },
  { id: 'chef',      name: 'Đầu bếp phở',  desc: 'Bán 50 tô phở',          check: (s) => (s.bowlsServed || 0) >= 50,  reward: 150000 },
  { id: 'boss',      name: 'Ông chủ',      desc: 'Kiếm tổng 1 triệu đồng', check: (s) => (s.totalEarned || 0) >= 1000000, reward: 200000 },
  { id: 'star',      name: 'Ngôi sao',     desc: 'Đạt 10 sao',             check: (s) => (s.stars || 0) >= 10,        reward: 100000 },
  { id: 'diligent',  name: 'Siêng năng',   desc: 'Chơi 7 ngày',            check: (s) => (s.daysPlayed || 0) >= 7,   reward: 100000 },
  { id: 'perfect',   name: 'Hoàn hảo',     desc: '10 tô perfect liên tiếp', check: (s) => (s.perfectStreak || 0) >= 10, reward: 200000 },
];

// Trả về mảng badge mới mở (chưa có trong unlockedIds mà check() true)
export function checkNewBadges(stats, unlockedIds) {
  const unlocked = new Set(unlockedIds || []);
  return BADGES.filter(b => !unlocked.has(b.id) && b.check(stats));
}

// Pool thử thách (lớn hơn 3 để random mỗi ngày)
export const CHALLENGE_POOL = [
  { id: 'ga5',      name: 'Bán 5 tô phở gà',            check: (s) => (s.dailyGa || 0) >= 5,                        reward: 30000 },
  { id: 'earn200',  name: 'Kiếm 200k trong ngày',       check: (s) => (s.dailyEarned || 0) >= 200000,               reward: 20000 },
  { id: 'noleave',  name: 'Không để khách nào bỏ đi',   check: (s) => (s.dailyServed || 0) > 0 && (s.dailyLeft || 0) === 0, reward: 50000 },
  { id: 'serve10',  name: 'Phục vụ 10 khách',          check: (s) => (s.dailyServed || 0) >= 10,                   reward: 40000 },
  { id: 'perfect3', name: '3 tô perfect trong ngày',   check: (s) => (s.dailyPerfect || 0) >= 3,                   reward: 40000 },
  { id: 'happy5',   name: '5 khách hài lòng',          check: (s) => (s.dailyHappy || 0) >= 5,                     reward: 30000 },
];

// PRNG seed đơn giản (mulberry32) để thử thách ổn định trong ngày
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random 3 thử thách từ pool, seed theo day để ổn định trong ngày
export function getDailyChallenges(day) {
  const rand = seededRandom((day || 1) * 7919);
  const pool = CHALLENGE_POOL.slice();
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// Khởi tạo stats progression (merge vào object stats hiện có)
export function initProgressionStats(stats) {
  const s = stats || {};
  s.bowlsServed = s.bowlsServed || 0;
  s.totalEarned = s.totalEarned || 0;
  s.daysPlayed = s.daysPlayed || 0;
  s.perfectStreak = s.perfectStreak || 0;
  s.dailyGa = s.dailyGa || 0;
  s.dailyEarned = s.dailyEarned || 0;
  s.dailyLeft = s.dailyLeft || 0;
  s.dailyServed = s.dailyServed || 0;
  s.dailyPerfect = s.dailyPerfect || 0;
  s.dailyHappy = s.dailyHappy || 0;
  s.badges = s.badges || [];           // mảng id huy hiệu đã mở
  s.challengeDay = s.challengeDay || 0; // ngày đã random thử thách
  s.challenges = s.challenges || [];   // mảng {id, done, claimed}
  s.challengeDone = s.challengeDone || [];
  return s;
}

// Reset stats ngày (gọi khi qua ngày mới)
export function resetDailyStats(stats) {
  stats.dailyGa = 0;
  stats.dailyEarned = 0;
  stats.dailyLeft = 0;
  stats.dailyServed = 0;
  stats.dailyPerfect = 0;
  stats.dailyHappy = 0;
  stats.challengeDone = [];
  stats.challengeDay = 0; // ép random lại thử thách cho ngày mới
  stats.challenges = [];
}

// Đảm bảo thử thách của ngày hiện tại đã được random
export function ensureDailyChallenges(stats, day) {
  if (stats.challengeDay !== day) {
    stats.challengeDay = day;
    stats.challenges = getDailyChallenges(day);
    stats.challengeDone = [];
  }
  return stats.challenges;
}

// Kiểm tra thử thách mới hoàn thành (chưa done)
export function checkNewChallenges(stats) {
  const done = new Set(stats.challengeDone || []);
  return (stats.challenges || []).filter(c => !done.has(c.id) && c.check(stats));
}
