// Phở Đi! - Hệ thống âm thanh
// Task 1.3: Web Audio API, nhạc nền + sfx tổng hợp (chưa cần file ngoài)

const LS_KEY = 'pho-di/audio';

let ctx = null;
let musicNodes = [];
let settings = { music: true, sfx: true, musicVol: 0.4, sfxVol: 0.8 };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved) settings = { ...settings, ...saved };
  } catch {}
}

function saveSettings() {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Mở khóa audio ở lần chạm đầu (fix iOS)
export function unlockAudio() {
  const unlock = () => {
    ensureCtx();
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}

function tone(freq, dur, type = 'sine', vol = 1, when = 0) {
  const c = ensureCtx();
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * settings.sfxVol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// SFX tổng hợp
const SFX = {
  click:   () => tone(600, 0.08, 'triangle', 0.5),
  success: () => { tone(523, 0.12, 'sine', 0.6); tone(659, 0.12, 'sine', 0.6, 0.1); tone(784, 0.2, 'sine', 0.6, 0.2); },
  fail:    () => { tone(220, 0.2, 'sawtooth', 0.3); tone(180, 0.3, 'sawtooth', 0.3, 0.15); },
  pop:     () => tone(880, 0.06, 'square', 0.3),
  coin:    () => { tone(988, 0.08, 'square', 0.25); tone(1319, 0.15, 'square', 0.25, 0.08); },
};

export function playSfx(name) {
  if (!settings.sfx) return;
  try {
    ensureCtx();
    SFX[name]?.();
  } catch (e) {
    console.warn('[Audio] sfx lỗi:', e.message);
  }
}

// Nhạc nền: giai điệu đơn giản loop bằng oscillator
const MELODY = [523, 587, 659, 587, 698, 659, 587, 523]; // Đô Rê Mi...
let musicTimer = null;

export function playMusic() {
  if (!settings.music || musicTimer) return;
  try {
    const c = ensureCtx();
    let i = 0;
    const step = 0.45;
    const playNote = () => {
      if (!settings.music) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = MELODY[i % MELODY.length];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12 * settings.musicVol, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + step);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + step);
      i++;
    };
    playNote();
    musicTimer = setInterval(playNote, step * 1000);
  } catch (e) {
    console.warn('[Audio] nhạc lỗi:', e.message);
  }
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function toggleMusic() {
  settings.music = !settings.music;
  saveSettings();
  if (settings.music) playMusic(); else stopMusic();
  return settings.music;
}

export function toggleSfx() {
  settings.sfx = !settings.sfx;
  saveSettings();
  return settings.sfx;
}

export function getSettings() {
  return { ...settings };
}

loadSettings();
