// ================= MAIN GAME ENGINE =================
const gameCanvas = document.getElementById('gameCanvas');
const gCtx = gameCanvas.getContext('2d');

const ARENA_HALF = 4500;

const FRUITS = [
  { emoji: '🍒', val: 2, r: 9 },
  { emoji: '🫐', val: 3, r: 9 },
  { emoji: '🍇', val: 4, r: 10 },
  { emoji: '🫒', val: 4, r: 9 },
  { emoji: '🍓', val: 5, r: 10 },
  { emoji: '🫛', val: 6, r: 10 },
  { emoji: '🌶️', val: 7, r: 10 },
  { emoji: '🥕', val: 8, r: 11 },
  { emoji: '🍎', val: 9, r: 11 },
  { emoji: '🍏', val: 10, r: 11 },
  { emoji: '🍐', val: 11, r: 11 },
  { emoji: '🍑', val: 12, r: 12 },
  { emoji: '🍌', val: 13, r: 12 },
  { emoji: '🍊', val: 14, r: 12 },
  { emoji: '🍋', val: 15, r: 12 },
  { emoji: '🍅', val: 16, r: 12 },
  { emoji: '🥒', val: 17, r: 12 },
  { emoji: '🌽', val: 18, r: 13 },
  { emoji: '🍆', val: 20, r: 13 },
  { emoji: '🥦', val: 22, r: 13 },
  { emoji: '🥑', val: 24, r: 13 },
  { emoji: '🥭', val: 25, r: 14 },
  { emoji: '🥝', val: 26, r: 13 },
  { emoji: '🥥', val: 28, r: 14 },
  { emoji: '🍍', val: 29, r: 14 },
  { emoji: '🍉', val: 30, r: 15 }
];

// Pre-render Fruit Sprites once for 60 FPS GPU-accelerated drawing
const fruitSprites = FRUITS.map((spec) => {
  const size = Math.ceil(spec.r * 2.8);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(spec.r * 2.1)}px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif`;
  ctx.fillText(spec.emoji, size / 2, size / 2 + 1);
  return c;
});

// Pre-render Static Illustrated Arena Tile
const arenaTile = document.createElement('canvas');
arenaTile.width = 512;
arenaTile.height = 512;
const tCtx = arenaTile.getContext('2d');
(function buildStaticArenaTile() {
  tCtx.fillStyle = '#14362b';
  tCtx.fillRect(0, 0, 512, 512);

  const shapes = [
    { x: 90, y: 110, r: 75, c: '#194335' },
    { x: 360, y: 140, r: 95, c: '#112e24' },
    { x: 220, y: 340, r: 110, c: '#194335' },
    { x: 430, y: 420, r: 65, c: '#1c4a3b' },
    { x: 70, y: 430, r: 55, c: '#112e24' }
  ];
  shapes.forEach(s => {
    tCtx.fillStyle = s.c;
    tCtx.beginPath();
    tCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    tCtx.fill();
  });

  tCtx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  tCtx.lineWidth = 2;
  tCtx.strokeRect(1, 1, 510, 510);
  tCtx.beginPath();
  tCtx.moveTo(256, 0);
  tCtx.lineTo(256, 512);
  tCtx.moveTo(0, 256);
  tCtx.lineTo(512, 256);
  tCtx.stroke();

  const pebbles = [
    [40, 50], [180, 70], [310, 45], [470, 90],
    [130, 210], [290, 230], [440, 270],
    [60, 320], [210, 460], [350, 380], [480, 480]
  ];
  tCtx.fillStyle = 'rgba(118, 200, 147, 0.12)';
  pebbles.forEach(([px, py]) => {
    tCtx.beginPath();
    tCtx.ellipse(px, py, 6, 3, 0.4, 0, Math.PI * 2);
    tCtx.fill();
  });
})();

let arenaPattern = null;

let player = null;
let bots = [];
let remoteWorms = [];
let foods = [];
let foodsById = new Map();
let respawnQueue = [];
let floatingTexts = [];
let powerups = [];
let isBoosting = false;
let pointerAngle = 0;
let gameAnimId = null;
let lastFrameTime = 0;
let currentZoom = 1.24;

// ================= MULTIPLAYER WEBSOCKET STATE =================
const PROD_WS_URL = 'wss://vortex-worms.onrender.com';
let wsSocket = null;
let mpConnected = false;
let mpOfflineFallback = false;
let mpPlayerId = null;
let mpServerPos = null;
let lastInputSentAt = 0;
let offlineTimer = null;

function getWsUrl() {
  const { protocol, hostname, host, port } = window.location;
  const isCapacitorApp =
    protocol === 'capacitor:' ||
    protocol === 'file:' ||
    (hostname === 'localhost' && !port);

  if (isCapacitorApp) {
    return PROD_WS_URL;
  }

  if (protocol === 'http:' || protocol === 'https:') {
    const proto = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${host}`;
  }

  return PROD_WS_URL;
}

function unpackFoodTuple(tuple) {
  const [id, x, y, t] = tuple;
  const spec = FRUITS[t] || FRUITS[0];
  return { id, x, y, t, emoji: spec.emoji, val: spec.val, r: spec.r };
}

function rebuildFoodMap(packedList) {
  foods = [];
  foodsById.clear();
  for (let i = 0; i < packedList.length; i++) {
    const item = unpackFoodTuple(packedList[i]);
    foods.push(item);
    foodsById.set(item.id, item);
  }
}

function sendMultiplayerInput(force = false) {
  if (!wsSocket || wsSocket.readyState !== WebSocket.OPEN || !inGame || !player) return;
  const now = performance.now();
  if (!force && now - lastInputSentAt < 33) return;
  lastInputSentAt = now;
  wsSocket.send(JSON.stringify({
    type: 'input',
    angle: Number(pointerAngle.toFixed(4)),
    boosting: Boolean(isBoosting)
  }));
}

function activateOfflineMode() {
  if (mpConnected || mpOfflineFallback) return;
  mpOfflineFallback = true;
  populateDenseFruits();
  bots = [];
  for (let i = 0; i < 24; i++) bots.push(spawnBot());
}

function connectMultiplayer(skinColors) {
  if (offlineTimer) {
    clearTimeout(offlineTimer);
    offlineTimer = null;
  }

  // Fallback to offline bots only if server cannot be reached within 5 seconds
  offlineTimer = setTimeout(() => {
    if (!mpConnected && inGame) {
      activateOfflineMode();
    }
  }, 5000);

  try {
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      mpConnected = true;
      mpOfflineFallback = false;
      bots = [];
      wsSocket.send(JSON.stringify({
        type: 'respawn',
        name: state.name,
        colors: skinColors
      }));
      return;
    }

    if (wsSocket && wsSocket.readyState === WebSocket.CONNECTING) {
      return;
    }

    const socket = new WebSocket(getWsUrl());
    wsSocket = socket;

    socket.addEventListener('open', () => {
      if (wsSocket !== socket) return;
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
      mpConnected = true;
      mpOfflineFallback = false;
      bots = [];
      socket.send(JSON.stringify({
        type: 'join',
        name: state.name,
        colors: skinColors
      }));
    });

    socket.addEventListener('message', (event) => {
      if (wsSocket !== socket) return;
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'joined') {
        mpPlayerId = msg.id;
        mpServerPos = null;
        if (Array.isArray(msg.foods)) {
          rebuildFoodMap(msg.foods);
        }
      } else if (msg.type === 'state') {
        if (!inGame || !player) return;

        if (Array.isArray(msg.foodsFull)) {
          rebuildFoodMap(msg.foodsFull);
        } else {
          if (Array.isArray(msg.eaten)) {
            for (const eid of msg.eaten) {
              foodsById.delete(eid);
            }
            foods = Array.from(foodsById.values());
          }
          if (Array.isArray(msg.spawned)) {
            for (const tup of msg.spawned) {
              const item = unpackFoodTuple(tup);
              foodsById.set(item.id, item);
            }
            foods = Array.from(foodsById.values());
          }
        }

        if (Array.isArray(msg.players)) {
          const prevRemoteMap = new Map(remoteWorms.map(w => [w.id, w]));
          const others = [];

          for (const sp of msg.players) {
            if (sp.id === mpPlayerId) {
              // First authoritative spawn position snap
              if (!mpServerPos) {
                player.x = sp.x;
                player.y = sp.y;
                player.angle = sp.angle;
                pointerAngle = sp.angle;
                if (Array.isArray(sp.segments) && sp.segments.length > 0) {
                  player.segments = sp.segments.map(s => ({ x: s.x, y: s.y }));
                }
              }
              mpServerPos = { x: sp.x, y: sp.y, angle: sp.angle };

              if (sp.score > player.score + 1) {
                const diff = Math.round(sp.score - player.score);
                player.mouthTimer = 0.28;
                playTone(540, 'sine', 0.05, 0.04);
                floatingTexts.push({
                  x: player.x,
                  y: player.y - 16,
                  text: `+${diff}`,
                  alpha: 1.0,
                  color: diff >= 20 ? '#ffd166' : '#80ed99'
                });
              }
              player.score = sp.score;
              player.shieldTime = sp.shield || 0;
            } else {
              const prev = prevRemoteMap.get(sp.id);
              let mouthTimer = prev ? (prev.mouthTimer || 0) : 0;
              if (prev && sp.score > prev.score + 1) {
                mouthTimer = 0.28;
              }
              others.push({
                id: sp.id,
                name: sp.name,
                colors: sp.colors,
                x: prev ? prev.x : sp.x,
                y: prev ? prev.y : sp.y,
                targetX: sp.x,
                targetY: sp.y,
                angle: prev ? prev.angle : sp.angle,
                targetAngle: sp.angle,
                score: sp.score,
                shieldTime: sp.shield || 0,
                mouthTimer,
                segments: sp.segments || [],
                isPlayer: false,
                effects: {}
              });
            }
          }
          remoteWorms = others;
        }
      } else if (msg.type === 'kill_credit') {
        playTone(680, 'triangle', 0.18, 0.09);
        showKillToast();
      } else if (msg.type === 'died') {
        if (player && inGame) {
          player.score = msg.score ?? player.score;
          killWorm(player, [], null);
        }
      }
    });

    socket.addEventListener('close', () => {
      if (wsSocket === socket) {
        mpConnected = false;
        remoteWorms = [];
        wsSocket = null;
        if (inGame) {
          activateOfflineMode();
        }
      }
    });

    socket.addEventListener('error', () => {
      mpConnected = false;
      if (inGame) {
        activateOfflineMode();
      }
    });
  } catch (e) {
    mpConnected = false;
    activateOfflineMode();
  }
}

function disconnectMultiplayer() {
  if (offlineTimer) {
    clearTimeout(offlineTimer);
    offlineTimer = null;
  }
  mpConnected = false;
  mpOfflineFallback = false;
  mpPlayerId = null;
  mpServerPos = null;
  remoteWorms = [];
  if (wsSocket) {
    try { wsSocket.close(); } catch (e) {}
    wsSocket = null;
  }
}

async function lockLandscapeOrientation() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (err) {}
}

function unlockOrientation() {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (err) {}
}

function randomPointInSquareArena(margin = 160) {
  const limit = ARENA_HALF - margin;
  return {
    x: (Math.random() * 2 - 1) * limit,
    y: (Math.random() * 2 - 1) * limit
  };
}

function createFruitItem(x, y) {
  const fIdx = Math.floor(Math.pow(Math.random(), 1.25) * FRUITS.length);
  const t = Math.min(FRUITS.length - 1, fIdx);
  const spec = FRUITS[t];
  return {
    x,
    y,
    t,
    emoji: spec.emoji,
    val: spec.val,
    r: spec.r
  };
}

function populateDenseFruits() {
  foods = [];
  foodsById.clear();
  respawnQueue = [];
  const clusterCount = 450;
  for (let c = 0; c < clusterCount; c++) {
    const center = randomPointInSquareArena(160);
    const itemsInCluster = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < itemsInCluster; k++) {
      const ox = center.x + (Math.random() - 0.5) * 44;
      const oy = center.y + (Math.random() - 0.5) * 44;
      if (Math.abs(ox) < ARENA_HALF - 80 && Math.abs(oy) < ARENA_HALF - 80) {
        foods.push(createFruitItem(ox, oy));
      }
    }
  }
}

function calcTargetSegments(score) {
  return Math.min(340, Math.floor(18 + Math.pow(Math.max(10, score), 0.56) * 1.45));
}

function calcWormRadius(score) {
  return Math.min(34, 13 + Math.pow(Math.max(10, score), 0.34) * 0.85);
}

function createWorm(x, y, name, skinColors, isPlayer = false) {
  const segs = [];
  const startLen = 18;
  for (let i = 0; i < startLen; i++) {
    segs.push({ x: x - i * 6, y });
  }
  return {
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    score: 10,
    name,
    colors: skinColors,
    segments: segs,
    isPlayer,
    shieldTime: isPlayer ? 4.0 : 2.0,
    mouthTimer: 0,
    aiTimer: 0,
    aiTargetAngle: Math.random() * Math.PI * 2,
    effects: { magnet: 0, double: 0, zoom: 0, freeBoost: 0 }
  };
}

function spawnBot() {
  const pos = randomPointInSquareArena(300);
  const botNames = ['Արամ', 'Անի', 'Դավիթ', 'Max', 'Nika', 'Leo', 'Տիգրան', 'Alex', 'Մհեր', 'Kira'];
  const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
  const bot = createWorm(pos.x, pos.y, botNames[Math.floor(Math.random() * botNames.length)], skin.colors, false);
  bot.score = 10 + Math.floor(Math.random() * 180);
  const targetSegs = calcTargetSegments(bot.score);
  while (bot.segments.length < targetSegs) {
    const last = bot.segments[bot.segments.length - 1];
    bot.segments.push({ x: last.x, y: last.y });
  }
  return bot;
}

function spawnPowerup() {
  const types = [
    { type: 'magnet', icon: '🧲', color: '#ef4444' },
    { type: 'double', icon: '⭐', color: '#facc15' },
    { type: 'zoom', icon: '🔭', color: '#38bdf8' },
    { type: 'freeBoost', icon: '⚡', color: '#a855f7' }
  ];
  const pick = types[Math.floor(Math.random() * types.length)];
  const pos = randomPointInSquareArena(220);
  powerups.push({ x: pos.x, y: pos.y, ...pick, r: 18 });
}

function showKillToast() {
  const container = document.getElementById('killToastContainer');
  const toast = document.createElement('div');
  toast.className = 'kill-toast';
  toast.textContent = I18N[state.lang].wormDefeated;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2250);
}

function startGame() {
  inGame = true;
  document.body.classList.add('in-game');
  lockLandscapeOrientation();

  document.getElementById('lobbyScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
  document.getElementById('killToastContainer').innerHTML = '';

  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  arenaPattern = gCtx.createPattern(arenaTile, 'repeat');

  const skin = SKINS.find(s => s.id === state.selectedSkin) || SKINS[0];
  player = createWorm(0, 0, state.name, skin.colors, true);
  pointerAngle = player.angle;
  isBoosting = false;
  currentZoom = 1.24;
  mpServerPos = null;
  mpOfflineFallback = false;

  foods = [];
  foodsById.clear();
  floatingTexts = [];
  powerups = [];
  bots = [];
  remoteWorms = [];

  connectMultiplayer(skin.colors);

  document.getElementById('gameCoinsVal').textContent = state.coins;
  document.getElementById('shieldNotice').style.display = 'none';

  startBgMusic();

  lastFrameTime = performance.now();
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  gameAnimId = requestAnimationFrame(gameLoop);
}

function exitToLobby() {
  inGame = false;
  disconnectMultiplayer();
  document.body.classList.remove('in-game');
  unlockOrientation();
  stopBgMusic();
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  document.getElementById('gameContainer').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('lobbyScreen').style.display = 'block';
  updateUI();
}

// Responsive Steering Input Handlers (never gets stuck)
function updatePointerAngleFromEvent(e) {
  if (!inGame || !player) return;
  const cx = gameCanvas.width / 2;
  const cy = gameCanvas.height / 2;
  pointerAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  sendMultiplayerInput();
}

gameCanvas.addEventListener('pointerdown', (e) => {
  updatePointerAngleFromEvent(e);
  sendMultiplayerInput(true);
});

gameCanvas.addEventListener('pointermove', (e) => {
  updatePointerAngleFromEvent(e);
});

const boostBtn = document.getElementById('boostBtn');
boostBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); isBoosting = true; sendMultiplayerInput(true); });
boostBtn.addEventListener('pointerup', (e) => { e.stopPropagation(); isBoosting = false; sendMultiplayerInput(true); });
boostBtn.addEventListener('pointercancel', (e) => { e.stopPropagation(); isBoosting = false; sendMultiplayerInput(true); });
boostBtn.addEventListener('pointerleave', () => { isBoosting = false; sendMultiplayerInput(true); });
window.addEventListener('keydown', (e) => { if (e.code === 'Space') { isBoosting = true; sendMultiplayerInput(true); } });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { isBoosting = false; sendMultiplayerInput(true); } });

document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('exitToLobbyBtn').addEventListener('click', exitToLobby);
document.getElementById('goLobbyBtn').addEventListener('click', exitToLobby);
document.getElementById('gameFsBtn').addEventListener('click', toggleFullscreen);
document.getElementById('gameSoundBtn').addEventListener('click', () => {
  state.sound = !state.sound;
  saveState();
  updateUI();
});

function killWorm(worm, allWorms, killer = null) {
  if (!mpConnected) {
    for (let i = 0; i < worm.segments.length; i += 2) {
      const s = worm.segments[i];
      const drop = createFruitItem(s.x + (Math.random() - 0.5) * 16, s.y + (Math.random() - 0.5) * 16);
      drop.t = FRUITS.length - 1;
      drop.val = 15;
      drop.emoji = '🍉';
      drop.r = 14;
      foods.push(drop);
    }
  }

  if (killer && killer.isPlayer && !worm.isPlayer) {
    playTone(680, 'triangle', 0.18, 0.09);
    showKillToast();
  }

  if (worm.isPlayer) {
    playTone(150, 'sawtooth', 0.35, 0.12);
    inGame = false;
    stopBgMusic();
    const earnedCoins = Math.max(5, Math.floor(player.score / 25));
    const earnedXp = Math.max(10, Math.floor(player.score / 15));
    state.coins += earnedCoins;
    state.xp += earnedXp;
    if (player.score > state.bestScore) state.bestScore = Math.floor(player.score);

    while (state.xp >= state.level * 100) {
      state.xp -= state.level * 100;
      state.level++;
    }
    saveState();
    updateUI();

    document.getElementById('finalScore').textContent = Math.floor(player.score);
    document.getElementById('goRewardText').textContent = `+${earnedCoins} 🪙 | +${earnedXp} XP`;
    document.getElementById('gameOverScreen').style.display = 'flex';
  } else {
    const idx = allWorms.indexOf(worm);
    if (idx !== -1) {
      allWorms.splice(idx, 1);
      allWorms.push(spawnBot());
    }
  }
}

function updateWorm(worm, dt) {
  if (worm.shieldTime > 0) {
    const prevShield = worm.shieldTime;
    worm.shieldTime = Math.max(0, worm.shieldTime - dt);
    if (worm.isPlayer && prevShield > 0 && worm.shieldTime === 0) {
      const notice = document.getElementById('shieldNotice');
      notice.style.display = 'block';
      setTimeout(() => { notice.style.display = 'none'; }, 1800);
    }
  }

  if (worm.mouthTimer > 0) {
    worm.mouthTimer = Math.max(0, worm.mouthTimer - dt);
  }

  for (const k in worm.effects) {
    if (worm.effects[k] > 0) worm.effects[k] = Math.max(0, worm.effects[k] - dt);
  }

  if (worm.isPlayer) {
    let diff = pointerAngle - worm.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    worm.angle += diff * Math.min(1, dt * 10);
    sendMultiplayerInput();
  } else {
    worm.aiTimer -= dt;
    if (worm.aiTimer <= 0) {
      worm.aiTimer = 0.6 + Math.random() * 1.2;
      worm.aiTargetAngle = worm.angle + (Math.random() - 0.5) * 1.6;
    }
    const wallMargin = 320;
    if (worm.x > ARENA_HALF - wallMargin || worm.x < -ARENA_HALF + wallMargin ||
        worm.y > ARENA_HALF - wallMargin || worm.y < -ARENA_HALF + wallMargin) {
      worm.aiTargetAngle = Math.atan2(-worm.y, -worm.x);
    }
    let diff = worm.aiTargetAngle - worm.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    worm.angle += diff * Math.min(1, dt * 6);
  }

  const wantsBoost = worm.isPlayer ? isBoosting : false;
  const canBoost = wantsBoost && (worm.score > 15 || worm.effects.freeBoost > 0);
  const speed = canBoost ? 340 : 195;

  if (!mpConnected && canBoost && worm.effects.freeBoost <= 0) {
    worm.score = Math.max(10, worm.score - dt * 5);
  }

  worm.x += Math.cos(worm.angle) * speed * dt;
  worm.y += Math.sin(worm.angle) * speed * dt;

  // Smoothly reconcile online player position with server without jitter
  if (mpConnected && worm.isPlayer && mpServerPos) {
    const errX = mpServerPos.x - worm.x;
    const errY = mpServerPos.y - worm.y;
    const errDist = Math.hypot(errX, errY);
    if (errDist > 160) {
      worm.x = mpServerPos.x;
      worm.y = mpServerPos.y;
    } else {
      const blend = Math.min(1, dt * 10);
      worm.x += errX * blend;
      worm.y += errY * blend;
    }
  }

  const rHead = calcWormRadius(worm.score);
  const maxCoord = ARENA_HALF - rHead;

  // Keep head strictly inside red border so name never detaches across the line
  if (Math.abs(worm.x) >= maxCoord || Math.abs(worm.y) >= maxCoord) {
    worm.x = Math.max(-maxCoord, Math.min(maxCoord, worm.x));
    worm.y = Math.max(-maxCoord, Math.min(maxCoord, worm.y));
    if (!mpConnected || !worm.isPlayer) {
      killWorm(worm, bots, null);
      return;
    }
  }

  const segSpacing = 6.2;
  worm.segments[0].x = worm.x;
  worm.segments[0].y = worm.y;

  const targetLen = calcTargetSegments(worm.score);
  while (worm.segments.length < targetLen) {
    const last = worm.segments[worm.segments.length - 1];
    worm.segments.push({ x: last.x, y: last.y });
  }
  while (worm.segments.length > targetLen && worm.segments.length > 12) {
    worm.segments.pop();
  }

  for (let i = 1; i < worm.segments.length; i++) {
    const prev = worm.segments[i - 1];
    const curr = worm.segments[i];
    const a = Math.atan2(prev.y - curr.y, prev.x - curr.x);
    curr.x = prev.x - Math.cos(a) * segSpacing;
    curr.y = prev.y - Math.sin(a) * segSpacing;
  }

  // Offline fruit eating (when online, server handles authoritative eating & removal)
  if (!mpConnected) {
    const eatRadius = rHead + (worm.effects.magnet > 0 ? 115 : 14);
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      const dist = Math.hypot(worm.x - f.x, worm.y - f.y);
      if (worm.effects.magnet > 0 && dist < 160) {
        f.x += (worm.x - f.x) * 0.14;
        f.y += (worm.y - f.y) * 0.14;
      }
      if (dist < eatRadius) {
        worm.mouthTimer = 0.28;
        const gained = f.val * (worm.effects.double > 0 ? 2 : 1);
        worm.score += gained;

        if (worm.isPlayer) {
          playTone(520 + f.val * 10, 'sine', 0.05, 0.04);
          floatingTexts.push({
            x: f.x,
            y: f.y - 10,
            text: `+${gained}`,
            alpha: 1.0,
            color: gained >= 20 ? '#ffd166' : '#80ed99'
          });
        }

        const delay = 1.2 + Math.random() * 1.3;
        const nextPos = randomPointInSquareArena(160);
        respawnQueue.push({ timer: delay, x: nextPos.x, y: nextPos.y });
        foods.splice(i, 1);
      }
    }
  }
}

function checkWormCollisions() {
  if (mpConnected) return;
  const all = [player, ...bots].filter(Boolean);
  for (let i = 0; i < all.length; i++) {
    const w1 = all[i];
    if (!w1 || w1.shieldTime > 0) continue;
    const r1 = calcWormRadius(w1.score) * 0.78;

    for (let j = 0; j < all.length; j++) {
      if (i === j) continue;
      const w2 = all[j];
      if (!w2) continue;
      const r2 = calcWormRadius(w2.score) * 0.78;

      for (let s = 2; s < w2.segments.length; s++) {
        const seg = w2.segments[s];
        if (Math.hypot(w1.x - seg.x, w1.y - seg.y) < r1 + r2) {
          killWorm(w1, bots, w2);
          if (w1.isPlayer) return;
          break;
        }
      }
    }
  }
}

function drawWorm(worm) {
  const r = calcWormRadius(worm.score);
  const len = worm.segments.length;
  if (len === 0) return;

  if (worm.shieldTime > 0) {
    const blink = worm.shieldTime < 1.5 && Math.floor(worm.shieldTime * 10) % 2 === 0;
    gCtx.strokeStyle = blink ? '#facc15' : 'rgba(76, 201, 240, 0.75)';
    gCtx.lineWidth = 4;
    gCtx.beginPath();
    gCtx.arc(worm.x, worm.y, r + 10, 0, Math.PI * 2);
    gCtx.stroke();
  }

  for (let i = len - 1; i >= 0; i--) {
    const seg = worm.segments[i];
    gCtx.fillStyle = worm.colors[i % worm.colors.length];
    gCtx.beginPath();
    gCtx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
    gCtx.fill();
  }

  const mx = worm.x + Math.cos(worm.angle) * (r * 0.66);
  const my = worm.y + Math.sin(worm.angle) * (r * 0.66);
  gCtx.save();
  gCtx.translate(mx, my);
  gCtx.rotate(worm.angle);

  if (worm.mouthTimer > 0) {
    const phase = Math.sin((worm.mouthTimer / 0.28) * Math.PI);
    const rx = r * (0.14 + 0.22 * phase);
    const ry = r * (0.20 + 0.26 * phase);

    gCtx.fillStyle = '#4a0e17';
    gCtx.beginPath();
    gCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    gCtx.fill();

    gCtx.fillStyle = '#ff758f';
    gCtx.beginPath();
    gCtx.ellipse(-rx * 0.25, 0, rx * 0.45, ry * 0.55, 0, 0, Math.PI * 2);
    gCtx.fill();

    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    gCtx.lineWidth = 1.2;
    gCtx.beginPath();
    gCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    gCtx.stroke();
  } else {
    gCtx.strokeStyle = 'rgba(35, 10, 15, 0.65)';
    gCtx.lineWidth = Math.max(1.5, r * 0.09);
    gCtx.lineCap = 'round';
    gCtx.beginPath();
    gCtx.arc(-r * 0.08, 0, r * 0.24, -0.45, 0.45);
    gCtx.stroke();
  }
  gCtx.restore();

  const eyeDist = r * 0.42;
  [-0.58, 0.58].forEach(offset => {
    const ex = worm.x + Math.cos(worm.angle + offset) * eyeDist;
    const ey = worm.y + Math.sin(worm.angle + offset) * eyeDist;
    gCtx.fillStyle = '#fff';
    gCtx.beginPath();
    gCtx.arc(ex, ey, r * 0.28, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.fillStyle = '#111';
    gCtx.beginPath();
    gCtx.arc(ex + Math.cos(worm.angle) * (r * 0.11), ey + Math.sin(worm.angle) * (r * 0.11), r * 0.14, 0, Math.PI * 2);
    gCtx.fill();
  });

  gCtx.fillStyle = '#fff';
  gCtx.font = 'bold 13px Segoe UI';
  gCtx.textAlign = 'center';
  gCtx.fillText(worm.name, worm.x, worm.y - r - 10);
}

function drawMinimap() {
  const size = 92;
  const pad = 12;
  const x0 = pad;
  const y0 = gameCanvas.height - pad - size;
  const cx = x0 + size / 2;
  const cy = y0 + size / 2;

  gCtx.save();
  gCtx.fillStyle = 'rgba(10, 20, 35, 0.34)';
  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  gCtx.lineWidth = 1.5;
  gCtx.beginPath();
  gCtx.roundRect(x0, y0, size, size, 10);
  gCtx.fill();
  gCtx.stroke();

  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  gCtx.lineWidth = 1;
  gCtx.beginPath();
  gCtx.moveTo(cx, y0 + 6);
  gCtx.lineTo(cx, y0 + size - 6);
  gCtx.moveTo(x0 + 6, cy);
  gCtx.lineTo(x0 + size - 6, cy);
  gCtx.stroke();

  const scale = (size / 2 - 6) / ARENA_HALF;
  const others = mpConnected ? remoteWorms : bots;
  others.forEach(b => {
    gCtx.fillStyle = 'rgba(255, 107, 107, 0.85)';
    gCtx.beginPath();
    gCtx.arc(cx + b.x * scale, cy + b.y * scale, 2, 0, Math.PI * 2);
    gCtx.fill();
  });

  if (player) {
    gCtx.fillStyle = '#80ed99';
    gCtx.beginPath();
    gCtx.arc(cx + player.x * scale, cy + player.y * scale, 3.5, 0, Math.PI * 2);
    gCtx.fill();
  }
  gCtx.restore();
}

function gameLoop(now) {
  if (!inGame || !player) return;
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (!mpConnected) {
    for (let i = respawnQueue.length - 1; i >= 0; i--) {
      respawnQueue[i].timer -= dt;
      if (respawnQueue[i].timer <= 0) {
        foods.push(createFruitItem(respawnQueue[i].x, respawnQueue[i].y));
        respawnQueue.splice(i, 1);
      }
    }
  } else {
    const lerp = Math.min(1, dt * 14);
    remoteWorms.forEach(rw => {
      if (rw.mouthTimer > 0) rw.mouthTimer = Math.max(0, rw.mouthTimer - dt);
      rw.x += (rw.targetX - rw.x) * lerp;
      rw.y += (rw.targetY - rw.y) * lerp;
      let aDiff = rw.targetAngle - rw.angle;
      while (aDiff > Math.PI) aDiff -= Math.PI * 2;
      while (aDiff < -Math.PI) aDiff += Math.PI * 2;
      rw.angle += aDiff * lerp;
    });
  }

  updateWorm(player, dt);
  if (!inGame) return;

  if (!mpConnected) {
    bots.forEach(b => updateWorm(b, dt));
    checkWormCollisions();
    if (!inGame) return;
  }

  const baseZoom = Math.max(0.72, 1.24 - Math.pow(Math.max(10, player.score), 0.34) * 0.014);
  const targetZoom = player.effects.zoom > 0 ? baseZoom * 0.72 : baseZoom;
  currentZoom += (targetZoom - currentZoom) * Math.min(1, dt * 2.4);

  gCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gCtx.save();
  gCtx.translate(gameCanvas.width / 2, gameCanvas.height / 2);
  gCtx.scale(currentZoom, currentZoom);
  gCtx.translate(-player.x, -player.y);

  // Outside void background
  gCtx.fillStyle = '#091510';
  gCtx.fillRect(-ARENA_HALF - 1500, -ARENA_HALF - 1500, (ARENA_HALF + 1500) * 2, (ARENA_HALF + 1500) * 2);

  // Square Illustrated Arena Floor
  gCtx.fillStyle = arenaPattern || '#14362b';
  gCtx.fillRect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2);

  // Glowing Square Arena Boundary
  gCtx.strokeStyle = '#ef4444';
  gCtx.lineWidth = 16;
  gCtx.strokeRect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2);

  // Viewport Culling Bounds
  const viewW = (gameCanvas.width / currentZoom) * 0.65;
  const viewH = (gameCanvas.height / currentZoom) * 0.65;

  // Draw Pre-rendered Fruit Sprites (fast GPU drawImage)
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    if (Math.abs(f.x - player.x) > viewW || Math.abs(f.y - player.y) > viewH) continue;
    const sprite = fruitSprites[f.t] || fruitSprites[0];
    gCtx.drawImage(sprite, f.x - sprite.width / 2, f.y - sprite.height / 2);
  }

  // Draw Remote Players / Bots & Player
  if (mpConnected) {
    remoteWorms.forEach(drawWorm);
  } else {
    bots.forEach(drawWorm);
  }
  drawWorm(player);

  // Draw Floating Score Numbers
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 38 * dt;
    ft.alpha -= 1.25 * dt;
    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }
    gCtx.save();
    gCtx.globalAlpha = ft.alpha;
    gCtx.font = '900 17px Segoe UI';
    gCtx.fillStyle = ft.color;
    gCtx.strokeStyle = '#000';
    gCtx.lineWidth = 3;
    gCtx.strokeText(ft.text, ft.x, ft.y);
    gCtx.fillText(ft.text, ft.x, ft.y);
    gCtx.restore();
  }

  gCtx.restore();

  drawMinimap();
  document.getElementById('scoreVal').textContent = Math.floor(player.score);

  const rivals = mpConnected ? remoteWorms : bots;
  const sortedAll = [player, ...rivals].sort((a, b) => b.score - a.score);
  const myRank = sortedAll.findIndex(w => w.isPlayer) + 1;
  const topFive = sortedAll.slice(0, 5);

  const lbTitleEl = document.getElementById('lbTitleText');
  const baseLbTitle = (I18N[state.lang] && I18N[state.lang].leaderboard) || 'ԱՌԱՋԱՏԱՐՆԵՐ';
  lbTitleEl.textContent = `${baseLbTitle} (${sortedAll.length})`;

  let lbHtml = topFive.map((w, idx) => `
    <div class="lb-row ${w.isPlayer ? 'me' : ''}">
      <span>${idx + 1}. ${w.name}</span>
      <span>${Math.floor(w.score)}</span>
    </div>
  `).join('');

  if (myRank > 5) {
    lbHtml += `
      <div class="lb-row me" style="border-top: 1px solid rgba(255,255,255,0.18); margin-top: 2px; padding-top: 2px;">
        <span>${myRank}. ${player.name}</span>
        <span>${Math.floor(player.score)}</span>
      </div>
    `;
  }

  document.getElementById('leaderboardList').innerHTML = lbHtml;

  gameAnimId = requestAnimationFrame(gameLoop);
}

// Init
updateUI();