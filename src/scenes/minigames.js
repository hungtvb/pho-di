// Task 4.1: Minigame chuẩn bị — 4 minigame đơn giản, không chấm điểm.
// Làm xong 1 minigame → buff +5% tiền bán trong ngày hiện tại.
// Mỗi minigame chỉ làm lại được sau 2 ngày (track riêng từng game: state.minigameCooldown).

export const MINIGAMES = [
  { id: 'ninh-xuong', name: 'Ninh xương', desc: 'Chạm 3 bong bóng to nhất', icon: 'assets/sprites/noi-nuoc-dung-v2.webp' },
  { id: 'thai-thit', name: 'Thái thịt', desc: 'Vuốt qua miếng thịt 3 lần', icon: 'assets/sprites/thit-bo-tai-v2.webp' },
  { id: 'rua-rau', name: 'Rửa rau', desc: 'Chạm rau bẩn để rửa sạch', icon: 'assets/sprites/rau-thom-v2.webp' },
  { id: 'pha-mam', name: 'Pha mắm', desc: 'Pha đúng công thức', icon: 'assets/icons/order.webp' },
];

export const MINIGAME_COOLDOWN_DAYS = 2;
export const MINIGAME_BUFF_PCT = 0.05; // +5% tiền bán trong ngày

// Kiểm tra có được chơi minigame không (cooldown 2 ngày, tính riêng từng game)
export function canPlayMinigame(state, gameId) {
  const cd = state.minigameCooldown;
  const lastDay = (cd && typeof cd === 'object') ? cd[gameId] : undefined;
  if (typeof lastDay !== 'number') return { ok: true, waitDays: 0 };
  const diff = (state.day || 1) - lastDay;
  if (diff >= MINIGAME_COOLDOWN_DAYS) return { ok: true, waitDays: 0 };
  return { ok: false, waitDays: Math.max(0, MINIGAME_COOLDOWN_DAYS - diff) };
}

// Buff % tiền bán còn hiệu lực trong ngày hiện tại (0 nếu hết/khác ngày)
export function getMinigameBuff(state) {
  const b = state.minigameBuff;
  if (b && b.day === state.day && typeof b.pct === 'number' && b.pct > 0) return b.pct;
  return 0;
}

// Modal chọn minigame. deps: { toast(msg, isErr), sfx(name) }
export function showMinigameMenu(container, state, deps) {
  const cards = MINIGAMES.map(m => ({ meta: m, ...canPlayMinigame(state, m.id) }));
  const modal = document.createElement('div');
  modal.className = 'name-modal minigame-modal';
  modal.innerHTML = `
    <div class="name-modal-box minigame-menu">
      <h2>Chuẩn bị</h2>
      <p class="name-modal-desc">Xong 1 minigame → +5% tiền bán hôm nay</p>
      <div class="minigame-grid">
        ${cards.map(({ meta: m, ok, waitDays }) => `
          <button class="minigame-card" data-game="${m.id}" ${ok ? '' : 'disabled'}>
            <img src="${m.icon}" alt="${m.name}" draggable="false">
            <div class="minigame-name">${m.name}</div>
            <div class="minigame-desc">${ok ? m.desc : `Chơi lại sau ${waitDays} ngày`}</div>
          </button>`).join('')}
      </div>
      <button class="btn-primary" data-act="close">Đóng</button>
    </div>`;
  container.appendChild(modal);
  deps.sfx('click');
  modal.querySelector('[data-act="close"]').addEventListener('click', () => { modal.remove(); deps.sfx('click'); });
  modal.querySelectorAll('.minigame-card:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => openMinigame(modal, container, state, btn.dataset.game, deps));
  });
}

function openMinigame(modal, container, state, id, deps) {
  const meta = MINIGAMES.find(m => m.id === id);
  if (!meta) return;
  const box = modal.querySelector('.name-modal-box');
  box.innerHTML = `
    <h2>${meta.name}</h2>
    <p class="name-modal-desc">${meta.desc}</p>
    <div class="minigame-stage" id="minigame-stage"></div>
    <button class="btn-primary" data-act="close">Bỏ qua</button>`;
  box.querySelector('[data-act="close"]').addEventListener('click', () => { modal.remove(); deps.sfx('click'); });
  const stage = box.querySelector('#minigame-stage');
  GAMES[id](stage, () => finishMinigame(container, state, id, deps, stage), deps);
}

function finishMinigame(container, state, id, deps, stage) {
  if (!stage.isConnected) return;
  const cd = (state.minigameCooldown && typeof state.minigameCooldown === 'object') ? state.minigameCooldown : {};
  state.minigameCooldown = { ...cd, [id]: state.day || 1 };
  state.minigameBuff = { day: state.day || 1, pct: MINIGAME_BUFF_PCT };
  deps.sfx('success');
  stage.innerHTML = `<div class="minigame-done">Chuẩn bị xong!<span>+5% tiền bán hôm nay</span></div>`;
  setTimeout(() => {
    const modal = container.querySelector('.minigame-modal');
    if (modal) modal.remove();
    deps.toast('Chuẩn bị xong! +5% tiền bán hôm nay.');
  }, 1300);
}

const GAMES = {
  // 1. Ninh xương: chạm vào bong bóng TO NHẤT hiện tại, đủ 3 lần → xong
  'ninh-xuong'(stage, done, deps) {
    stage.innerHTML = `
      <div class="pot-area">
        <div class="bubble-layer"></div>
        <img src="assets/sprites/noi-nuoc-dung-v2.webp" class="pot-img" alt="Nồi nước dùng" draggable="false">
      </div>
      <div class="minigame-progress">Đã chạm: <b id="mg-hits">0</b>/3</div>`;
    const layer = stage.querySelector('.bubble-layer');
    const hitsEl = stage.querySelector('#mg-hits');
    let hits = 0;
    let finished = false;
    const spawn = () => {
      if (!stage.isConnected || finished) return;
      const b = document.createElement('button');
      const size = 34 + Math.random() * 20; // 34–54px (chuẩn touch >=34px)
      b.className = 'bubble';
      b.style.width = b.style.height = `${size.toFixed(0)}px`;
      b.style.left = `${6 + Math.random() * 80}%`;
      b.dataset.size = size.toFixed(1);
      b.setAttribute('aria-label', 'Bong bóng');
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (finished) return;
        let biggest = null;
        layer.querySelectorAll('.bubble').forEach(x => {
          if (!biggest || parseFloat(x.dataset.size) > parseFloat(biggest.dataset.size)) biggest = x;
        });
        if (b === biggest) {
          hits++;
          hitsEl.textContent = hits;
          deps.sfx('click');
          finished = hits >= 3;
          b.classList.add('popped');
          const el = b;
          setTimeout(() => el.remove(), 160);
          if (finished) { done(); }
        } else {
          b.classList.add('wrong');
          setTimeout(() => b.classList.remove('wrong'), 320);
        }
      });
      layer.appendChild(b);
      setTimeout(() => { if (b.isConnected) b.remove(); }, 2500);
    };
    spawn(); spawn();
    const timer = setInterval(() => {
      if (!stage.isConnected || finished) { clearInterval(timer); return; }
      spawn();
    }, 650);
  },

  // 2. Thái thịt: vuốt ngang qua miếng thịt, đủ 3 nhát → xong
  'thai-thit'(stage, done, deps) {
    stage.innerHTML = `
      <img src="assets/sprites/thit-bo-tai-v2.webp" class="meat-img" id="mg-meat" alt="Miếng thịt" draggable="false">
      <div class="minigame-progress">Đã thái: <b id="mg-cuts">0</b>/3</div>`;
    const meat = stage.querySelector('#mg-meat');
    const cutsEl = stage.querySelector('#mg-cuts');
    const THRESHOLD = 110; // px vuốt ngang trên thịt = 1 nhát
    let cuts = 0, acc = 0, lastX = null, finished = false;
    stage.addEventListener('pointermove', (e) => {
      if (finished || !stage.isConnected) return;
      const r = meat.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) { lastX = null; acc = 0; return; }
      if (lastX !== null) acc += Math.abs(e.clientX - lastX);
      lastX = e.clientX;
      if (acc >= THRESHOLD) {
        acc = 0;
        cuts++;
        cutsEl.textContent = cuts;
        deps.sfx('click');
        meat.classList.remove('cut-flash');
        void meat.offsetWidth;
        meat.classList.add('cut-flash');
        if (cuts >= 3) { finished = true; done(); }
      }
    });
  },

  // 3. Rửa rau: 5 rau, 2 rau bẩn (nâu) → chạm để rửa sạch
  'rua-rau'(stage, done, deps) {
    const dirtyIdx = new Set();
    while (dirtyIdx.size < 2) dirtyIdx.add(Math.floor(Math.random() * 5));
    stage.innerHTML = `
      <p class="minigame-hint2">Chạm vào rau bẩn (viền nâu) để rửa sạch</p>
      <div class="veggie-row">
        ${[0, 1, 2, 3, 4].map(i => `
          <button class="veggie ${dirtyIdx.has(i) ? 'dirty' : ''}" aria-label="Rau">
            <img src="assets/sprites/rau-thom-v2.webp" alt="Rau" draggable="false">
          </button>`).join('')}
      </div>
      <div class="minigame-progress">Còn bẩn: <b id="mg-dirty">2</b></div>`;
    const dirtyEl = stage.querySelector('#mg-dirty');
    let left = 2;
    let finished = false;
    stage.querySelectorAll('.veggie').forEach(v => {
      v.addEventListener('click', () => {
        if (finished || !v.classList.contains('dirty')) return;
        v.classList.remove('dirty');
        v.classList.add('cleaned');
        deps.sfx('click');
        left--;
        dirtyEl.textContent = left;
        if (left <= 0) { finished = true; done(); }
      });
    });
  },

  // 4. Pha mắm: chạm nguyên liệu đúng số lượng công thức
  'pha-mam'(stage, done, deps) {
    const recipe = [
      { id: 'mam', name: 'Nước mắm', need: 2 },
      { id: 'duong', name: 'Đường', need: 1 },
      { id: 'chanh', name: 'Chanh', need: 1 },
    ];
    const have = { mam: 0, duong: 0, chanh: 0 };
    stage.innerHTML = `
      <p class="minigame-hint2">Công thức: 2 mắm + 1 đường + 1 chanh</p>
      <div class="mam-bowl"><span class="bowl-label">Bát mắm</span><div class="bowl-items" id="mg-bowl-items"></div></div>
      <div class="ing-row">
        ${recipe.map(r => `
          <button class="ing-btn" data-ing="${r.id}">
            <span class="ing-name">${r.name}</span>
            <span class="ing-count"><b id="mg-${r.id}">0</b>/${r.need}</span>
          </button>`).join('')}
      </div>`;
    const bowlItems = stage.querySelector('#mg-bowl-items');
    let finished = false;
    stage.querySelectorAll('.ing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (finished) return;
        const id = btn.dataset.ing;
        const need = recipe.find(r => r.id === id).need;
        if (have[id] >= need) {
          btn.classList.add('wrong');
          setTimeout(() => btn.classList.remove('wrong'), 320);
          return;
        }
        have[id]++;
        stage.querySelector(`#mg-${id}`).textContent = have[id];
        const chip = document.createElement('span');
        chip.className = 'bowl-chip';
        chip.textContent = recipe.find(r => r.id === id).name;
        bowlItems.appendChild(chip);
        deps.sfx('click');
        if (recipe.every(r => have[r.id] >= r.need)) { finished = true; done(); }
      });
    });
  },
};
