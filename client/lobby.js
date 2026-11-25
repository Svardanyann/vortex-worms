// ==========================================
// VORTEX WORMS: PROFILE, SHOP, I18N & LOBBY
// ==========================================

const SKINS = [
  { id: 'classic_blue', name: 'Սառցե Ալիք', price: 0, colors: ['#ffffff', '#e2e8f0', '#38bdf8'] },
  { id: 'emerald_viper', name: 'Զմրուխտե Օձ', price: 120, colors: ['#10b981', '#059669', '#a7f3d0'] },
  { id: 'lava_flame', name: 'Հրե Կրակ', price: 220, colors: ['#f97316', '#ef4444', '#facc15'] },
  { id: 'neon_cyber', name: 'Նեոն Փոթորիկ', price: 350, colors: ['#a855f7', '#ec4899', '#38bdf8'] },
  { id: 'royal_gold', name: 'Ոսկե Արքա', price: 500, colors: ['#fbbf24', '#d97706', '#fef08a'] },
  { id: 'melon_king', name: 'Ձմերուկի Արքա', price: 180, colors: ['#ef4444', '#22c55e', '#15803d'] }
];

const AVATARS = ['🐛', '🐍', '🐉', '👑', '⚡', '🔥', '🍉', '😎', '🤖', '🦊'];

const DEFAULT_PROFILE = {
  name: 'Սամվել',
  avatar: '🐛',
  coins: 250,
  xp: 35,
  level: 1,
  bestScore: 0,
  selectedSkin: 'classic_blue',
  unlockedSkins: ['classic_blue'],
  lang: 'hy'
};

function loadProfile() {
  try {
    const raw = localStorage.getItem('vortex_worms_profile_v1');
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlockedSkins: Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length
        ? parsed.unlockedSkins
        : ['classic_blue']
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile() {
  try {
    localStorage.setItem('vortex_worms_profile_v1', JSON.stringify(profile));
  } catch {}
}

let profile = loadProfile();

function xpNeededForLevel(lvl) {
  return 100 + (lvl - 1) * 40;
}

function addXp(amount) {
  profile.xp += amount;
  let needed = xpNeededForLevel(profile.level);
  while (profile.xp >= needed) {
    profile.xp -= needed;
    profile.level += 1;
    profile.coins += 30;
    needed = xpNeededForLevel(profile.level);
  }
}

function applyLocalization() {
  if (typeof setActiveLanguage === 'function') {
    setActiveLanguage(profile.lang);
  }
  document.getElementById('logoSubText').textContent = t('logoSub');
  document.getElementById('startGameBtn').textContent = t('playBtn');
  document.getElementById('openFriendsBtn').textContent = t('friendsBtn');
  document.getElementById('openShopBtn').textContent = t('workshopBtn');
  document.getElementById('lobbyHintText').textContent = t('lobbyHint');
  document.getElementById('shopModalTitle').textContent = t('workshopTitle');
  document.getElementById('profileModalTitle').textContent = t('profileTitle');
  document.getElementById('nameLabel').textContent = t('nameLabel');
  document.getElementById('avatarLabel').textContent = t('avatarLabel');
  document.getElementById('saveProfileBtn').textContent = t('saveBtn');
  document.getElementById('friendsModalTitle').textContent = t('friendsTitle');
  document.getElementById('createRoomTitle').textContent = t('createRoomTitle');
  document.getElementById('createRoomSubmitBtn').textContent = t('createBtn');
  document.getElementById('joinRoomTitle').textContent = t('joinRoomTitle');
  document.getElementById('joinRoomSubmitBtn').textContent = t('joinBtn');
  document.getElementById('settingsModalTitle').textContent = t('settingsTitle');
  document.getElementById('musicSettingLabel').textContent = t('musicVolLabel');
  document.getElementById('sfxSettingLabel').textContent = t('sfxVolLabel');
  document.getElementById('langSettingLabel').textContent = t('langLabel');
  document.getElementById('fsSettingLabel').textContent = t('fullscreenLabel');
  document.getElementById('lbTitleText').textContent = t('leaderboardTitle');
  document.getElementById('goTitle').textContent = t('gameOverTitle');
  document.getElementById('goScoreLabel').textContent = t('yourScoreLabel');
  document.getElementById('playAgainBtn').textContent = t('playAgainBtn');
  document.getElementById('goLobbyBtn').textContent = t('lobbyBtn');
  document.getElementById('rotateHint').textContent = t('rotateHint');

  const freeGiftEl = document.getElementById('freeGiftLabel');
  if (freeGiftEl) freeGiftEl.textContent = t('freeLabel');

  const langBtn = document.getElementById('cycleLangSettingBtn');
  if (langBtn) langBtn.textContent = getLangButtonLabel(profile.lang);

  const micBtn = document.getElementById('toggleMicBtn');
  const spkBtn = document.getElementById('toggleSpeakerBtn');
  if (micBtn) micBtn.title = t('micTitle');
  if (spkBtn) spkBtn.title = t('speakerTitle');

  updateFsButtonsText();
}

function updateFsButtonsText() {
  const active = typeof isFullscreenActive === 'function' && isFullscreenActive();
  const fsSettingBtn = document.getElementById('fsSettingBtn');
  if (fsSettingBtn) {
    fsSettingBtn.textContent = active ? `✕ ${t('exitFullscreen')}` : `⛶ ${t('openFullscreen')}`;
  }
}

function refreshLobbyUI() {
  document.getElementById('lobbyAvatar').textContent = profile.avatar;
  document.getElementById('lobbyLevel').textContent = profile.level;
  document.getElementById('lobbyNameBtn').textContent = profile.name;
  document.getElementById('lobbyCoins').textContent = profile.coins;

  const gameCoinsEl = document.getElementById('gameCoinsVal');
  if (gameCoinsEl) gameCoinsEl.textContent = profile.coins;

  const needed = xpNeededForLevel(profile.level);
  const pct = Math.max(4, Math.min(100, Math.round((profile.xp / needed) * 100)));
  document.getElementById('lobbyXpFill').style.width = `${pct}%`;
  document.getElementById('lobbyXpText').textContent = `${profile.xp} / ${needed} XP`;
}

function openModal(id) {
  if (typeof sfx !== 'undefined') sfx.playClick();
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
});

document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });
});

function renderShop() {
  const grid = document.getElementById('skinsGrid');
  grid.innerHTML = '';

  SKINS.forEach((skin) => {
    const owned = profile.unlockedSkins.includes(skin.id);
    const equipped = profile.selectedSkin === skin.id;

    const card = document.createElement('div');
    card.className = `skin-card ${equipped ? 'equipped' : ''}`;

    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    skin.colors.forEach((c) => {
      const dot = document.createElement('div');
      dot.className = 'skin-dot';
      dot.style.background = c;
      preview.appendChild(dot);
    });

    const nameEl = document.createElement('div');
    nameEl.className = 'skin-name';
    nameEl.textContent = skin.name;

    const btn = document.createElement('button');
    btn.className = `skin-btn ${equipped ? 'equipped' : owned ? 'equip' : 'buy'}`;
    if (equipped) {
      btn.textContent = t('equippedBtn');
    } else if (owned) {
      btn.textContent = t('equipBtn');
    } else {
      btn.textContent = `${skin.price} 🪙`;
    }

    btn.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') sfx.playClick();
      if (owned) {
        profile.selectedSkin = skin.id;
        saveProfile();
        renderShop();
      } else if (profile.coins >= skin.price) {
        profile.coins -= skin.price;
        profile.unlockedSkins.push(skin.id);
        profile.selectedSkin = skin.id;
        saveProfile();
        refreshLobbyUI();
        renderShop();
      } else {
        alert(t('notEnoughCoins'));
      }
    });

    card.appendChild(preview);
    card.appendChild(nameEl);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

document.getElementById('openShopBtn').addEventListener('click', () => {
  renderShop();
  openModal('shopModal');
});

function openProfileModal() {
  document.getElementById('playerNameInput').value = profile.name;
  const picker = document.getElementById('avatarPicker');
  picker.innerHTML = '';
  AVATARS.forEach((av) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = `avatar-opt ${av === profile.avatar ? 'selected' : ''}`;
    opt.textContent = av;
    opt.addEventListener('click', () => {
      picker.querySelectorAll('.avatar-opt').forEach((x) => x.classList.remove('selected'));
      opt.classList.add('selected');
      opt.dataset.chosen = av;
    });
    picker.appendChild(opt);
  });
  openModal('profileModal');
}

document.getElementById('openProfileBtn').addEventListener('click', openProfileModal);
document.getElementById('lobbyNameBtn').addEventListener('click', openProfileModal);

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  const val = document.getElementById('playerNameInput').value.trim();
  if (val) profile.name = val.slice(0, 16);
  const selectedOpt = document.querySelector('#avatarPicker .avatar-opt.selected');
  if (selectedOpt) profile.avatar = selectedOpt.textContent;
  saveProfile();
  refreshLobbyUI();
  closeModal('profileModal');
});

document.getElementById('addFreeCoinsBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playCoin();
  profile.coins += 50;
  saveProfile();
  refreshLobbyUI();
});

document.querySelectorAll('.promo-card').forEach((card) => {
  card.addEventListener('click', () => {
    if (typeof sfx !== 'undefined') sfx.playClick();
    const type = card.getAttribute('data-promo');
    const titleEl = document.getElementById('infoModalTitle');
    const bodyEl = document.getElementById('infoModalBody');

    if (type === 'chest') {
      profile.coins += 100;
      saveProfile();
      refreshLobbyUI();
      titleEl.textContent = t('freeGiftTitle');
      bodyEl.innerHTML = `<div style="font-size:42px;">🎁</div><div style="font-weight:800;font-size:18px;color:#fbbf24;">+100 🪙</div><p>${t('freeGiftDesc')}</p>`;
    } else if (type === 'starter') {
      titleEl.textContent = t('starterPackTitle');
      bodyEl.innerHTML = `<div style="font-size:40px;">🦸‍♂️</div><p>${t('starterPackDesc')}</p>`;
    } else {
      titleEl.textContent = t('piggyBankTitle');
      bodyEl.innerHTML = `<div style="font-size:40px;">🐷</div><p>${t('piggyBankDesc')}</p>`;
    }
    openModal('infoModal');
  });
});

document.getElementById('openRecordsBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  document.getElementById('infoModalTitle').textContent = t('recordsTitle');
  document.getElementById('infoModalBody').innerHTML = `
    <div style="font-size:40px;">🏆</div>
    <div style="font-size:18px;font-weight:800;">${t('bestScoreLabel')}: <span style="color:#fde047;">${profile.bestScore}</span></div>
    <div style="font-size:15px;opacity:0.9;">${t('levelLabel')}: ${profile.level} | ${t('coinsLabel')}: ${profile.coins}</div>
  `;
  openModal('infoModal');
});

document.getElementById('shareGameBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  const shareUrl = location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }
  document.getElementById('infoModalTitle').textContent = t('inviteTitle');
  document.getElementById('infoModalBody').innerHTML = `
    <div style="font-size:38px;">📤</div>
    <p style="font-weight:700;">${t('inviteDesc')}</p>
    <div style="background:rgba(15,23,42,0.55);padding:8px 10px;border-radius:10px;font-size:13px;word-break:break-all;">${shareUrl}</div>
  `;
  openModal('infoModal');
});

const musicSlider = document.getElementById('musicVolSlider');
const sfxSlider = document.getElementById('sfxVolSlider');
const musicValEl = document.getElementById('musicVolVal');
const sfxValEl = document.getElementById('sfxVolVal');

function syncAudioSlidersUI() {
  if (typeof sfx === 'undefined') return;
  musicSlider.value = String(sfx.musicVol);
  sfxSlider.value = String(sfx.sfxVol);
  musicValEl.textContent = `${sfx.musicVol}%`;
  sfxValEl.textContent = `${sfx.sfxVol}%`;
}

musicSlider.addEventListener('input', () => {
  const v = Number(musicSlider.value);
  musicValEl.textContent = `${v}%`;
  if (typeof sfx !== 'undefined') sfx.setMusicVol(v);
});

sfxSlider.addEventListener('input', () => {
  const v = Number(sfxSlider.value);
  sfxValEl.textContent = `${v}%`;
  if (typeof sfx !== 'undefined') {
    sfx.setSfxVol(v);
    sfx.playClick();
  }
});

document.getElementById('openSettingsBtn').addEventListener('click', () => {
  syncAudioSlidersUI();
  updateFsButtonsText();
  openModal('settingsModal');
});

document.getElementById('cycleLangSettingBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  profile.lang = getNextLanguage(profile.lang);
  saveProfile();
  applyLocalization();
});

document.getElementById('fullscreenLobbyBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  if (typeof toggleAppFullscreen === 'function') toggleAppFullscreen();
  setTimeout(updateFsButtonsText, 120);
});

document.getElementById('fsSettingBtn').addEventListener('click', () => {
  if (typeof sfx !== 'undefined') sfx.playClick();
  if (typeof toggleAppFullscreen === 'function') toggleAppFullscreen();
  setTimeout(updateFsButtonsText, 120);
});

document.addEventListener('fullscreenchange', updateFsButtonsText);
document.addEventListener('webkitfullscreenchange', updateFsButtonsText);

let secLeft1 = 3 * 86400 + 11 * 3600;
let secLeft2 = 23 * 3600 + 30 * 60;

function formatTimer(totalSec) {
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}${t('dayShort')} ${h}${t('hourShort')}`;
  return `${h}${t('hourShort')} ${m}${t('minShort')}`;
}

setInterval(() => {
  if (secLeft1 > 60) secLeft1 -= 60;
  if (secLeft2 > 60) secLeft2 -= 60;
  document.getElementById('timer1').textContent = formatTimer(secLeft1);
  document.getElementById('timer2').textContent = formatTimer(secLeft2);
}, 60000);

// ==========================================
// INTERACTIVE LOBBY WORM CANVAS
// ==========================================
const lobbyCanvas = document.getElementById('lobbyCanvas');
const lobbyScreen = document.getElementById('lobbyScreen');
const lctx = lobbyCanvas.getContext('2d');

const lobbyWorm = {
  x: 0,
  y: 0,
  angle: -0.4,
  targetAngle: -0.4,
  speed: 135,
  radius: 17,
  segments: [],
  dragging: false,
  pointerId: null
};

function initLobbyWorm() {
  lobbyWorm.x = lobbyCanvas.width * 0.5;
  lobbyWorm.y = lobbyCanvas.height * 0.56;
  lobbyWorm.segments = [];
  for (let i = 0; i < 28; i++) {
    lobbyWorm.segments.push({
      x: lobbyWorm.x - Math.cos(lobbyWorm.angle) * i * 5.2,
      y: lobbyWorm.y - Math.sin(lobbyWorm.angle) * i * 5.2
    });
  }
}

function resizeLobby() {
  lobbyCanvas.width = window.innerWidth;
  lobbyCanvas.height = window.innerHeight;
  if (!lobbyWorm.segments.length) initLobbyWorm();
}
window.addEventListener('resize', resizeLobby);
resizeLobby();

function getLobbyWormSpawn(arenaHalfVal = 3000) {
  const w = Math.max(1, lobbyCanvas.width || window.innerWidth);
  const h = Math.max(1, lobbyCanvas.height || window.innerHeight);
  const nx = (lobbyWorm.x / w - 0.5) * 2;
  const ny = (lobbyWorm.y / h - 0.5) * 2;
  const limit = Math.max(400, arenaHalfVal - 650);
  return {
    x: Math.max(-limit, Math.min(limit, nx * (limit * 0.75))),
    y: Math.max(-limit, Math.min(limit, ny * (limit * 0.75))),
    angle: lobbyWorm.angle
  };
}

lobbyCanvas.addEventListener('pointerdown', (e) => {
  if (typeof sfx !== 'undefined') {
    sfx.ensure();
    sfx.startMusic();
  }
  if (typeof requestAppFullscreen === 'function') requestAppFullscreen();

  const dist = Math.hypot(e.clientX - lobbyWorm.x, e.clientY - lobbyWorm.y);
  if (dist < 130) {
    lobbyWorm.dragging = true;
    lobbyWorm.pointerId = e.pointerId;
    lobbyWorm.targetAngle = Math.atan2(e.clientY - lobbyWorm.y, e.clientX - lobbyWorm.x);
  } else {
    lobbyWorm.targetAngle = Math.atan2(e.clientY - lobbyWorm.y, e.clientX - lobbyWorm.x);
  }
});

window.addEventListener('pointermove', (e) => {
  if (lobbyWorm.dragging && e.pointerId === lobbyWorm.pointerId) {
    lobbyWorm.targetAngle = Math.atan2(e.clientY - lobbyWorm.y, e.clientX - lobbyWorm.x);
  }
});

window.addEventListener('pointerup', (e) => {
  if (e.pointerId === lobbyWorm.pointerId) {
    lobbyWorm.dragging = false;
    lobbyWorm.pointerId = null;
  }
});

let lastLobbyTime = performance.now();
function lobbyLoop(now) {
  const dt = Math.min(0.05, (now - lastLobbyTime) / 1000);
  lastLobbyTime = now;

  if (lobbyCanvas.style.display !== 'none') {
    const w = lobbyCanvas.width;
    const h = lobbyCanvas.height;

    const bgGrad = lctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#5ec8e5');
    bgGrad.addColorStop(0.55, '#42b883');
    bgGrad.addColorStop(1, '#2a9d8f');
    lctx.fillStyle = bgGrad;
    lctx.fillRect(0, 0, w, h);

    lctx.strokeStyle = 'rgba(255,255,255,0.22)';
    lctx.lineWidth = 3;
    lctx.beginPath();
    lctx.arc(w * 0.5, h * 0.56, Math.min(w, h) * 0.25, 0, Math.PI * 2);
    lctx.stroke();

    const margin = 75;
    if (!lobbyWorm.dragging) {
      if (lobbyWorm.x < margin || lobbyWorm.x > w - margin || lobbyWorm.y < margin + 50 || lobbyWorm.y > h - margin - 60) {
        lobbyWorm.targetAngle = Math.atan2(h * 0.54 - lobbyWorm.y, w * 0.5 - lobbyWorm.x);
      } else if (Math.random() < 0.015) {
        lobbyWorm.targetAngle += (Math.random() - 0.5) * 1.1;
      }
    }

    let diff = lobbyWorm.targetAngle - lobbyWorm.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    lobbyWorm.angle += diff * Math.min(1, dt * 6.5);

    const spd = lobbyWorm.dragging ? lobbyWorm.speed * 1.45 : lobbyWorm.speed;
    lobbyWorm.x += Math.cos(lobbyWorm.angle) * spd * dt;
    lobbyWorm.y += Math.sin(lobbyWorm.angle) * spd * dt;

    lobbyWorm.segments.unshift({ x: lobbyWorm.x, y: lobbyWorm.y });
    const spacing = 5.2;
    const kept = [lobbyWorm.segments[0]];
    let acc = 0;
    for (let i = 1; i < lobbyWorm.segments.length && kept.length < 28; i++) {
      const prev = kept[kept.length - 1];
      const cur = lobbyWorm.segments[i];
      const d = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      acc += d;
      if (acc >= spacing) {
        kept.push({ x: cur.x, y: cur.y });
        acc = 0;
      }
    }
    lobbyWorm.segments = kept;

    const skin = SKINS.find((s) => s.id === profile.selectedSkin) || SKINS[0];
    const cols = skin.colors;

    for (let i = lobbyWorm.segments.length - 1; i >= 1; i--) {
      const s = lobbyWorm.segments[i];
      const taper = i > 20 ? Math.max(0.35, 1 - ((i - 20) / 8) * 0.65) : 1;
      const r = lobbyWorm.radius * taper;
      lctx.fillStyle = cols[Math.floor(i / 4) % cols.length];
      lctx.beginPath();
      lctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      lctx.fill();
      lctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
      lctx.lineWidth = 1.2;
      lctx.stroke();
    }

    lctx.save();
    lctx.translate(lobbyWorm.x, lobbyWorm.y);
    lctx.rotate(lobbyWorm.angle);
    lctx.fillStyle = cols[0];
    lctx.beginPath();
    lctx.arc(0, 0, lobbyWorm.radius * 1.06, 0, Math.PI * 2);
    lctx.fill();
    lctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
    lctx.lineWidth = 1.5;
    lctx.stroke();

    for (const side of [-1, 1]) {
      lctx.fillStyle = '#fff';
      lctx.beginPath();
      lctx.arc(5.5, side * 7.5, 5.5, 0, Math.PI * 2);
      lctx.fill();
      lctx.fillStyle = '#0f172a';
      lctx.beginPath();
      lctx.arc(7.2, side * 7.5, 2.8, 0, Math.PI * 2);
      lctx.fill();
    }
    lctx.restore();
  }

  requestAnimationFrame(lobbyLoop);
}

applyLocalization();
refreshLobbyUI();
requestAnimationFrame(lobbyLoop);