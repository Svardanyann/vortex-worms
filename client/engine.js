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

// Pre-render Static Illustrated Arena Tile once
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

let arenaPattern = gCtx.createPattern(arenaTile, 'repeat');

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
let lastStartAt = 0;

// ================= MULTIPLAYER WEBSOCKET STATE =================
const PROD_WS_URL = 'wss://vortex-worms.onrender.com';
let wsSocket = null;
let mpConnected = false;
let mpOfflineFallback = false;
let mpPlayerId = null;
let mpServerPos = null;
let mpAwaitingJoinAck = false;
let lastInputSentAt = 0;
let offlineTimer = null;

function isCapacitorEnv() {
  const { protocol, hostname, port } = window.location;
  return (
    protocol === 'capacitor:' ||
    protocol === 'file:' ||
    (hostname === 'localhost' && !port)
  );
}

function getWsUrl() {
  if (isCapacitorEnv()) return PROD_WS_URL;
  const { protocol, host } = window.location;
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

function rebuildFoodList(packedList) {
  foods = new Array(packedList.length);
  foodsById.clear();
  for (let i = 0; i < packedList.length; i++) {
    const item = unpackFoodTuple(packedList[i]);
    foods[i] = item;
    foodsById.set(item.id, i);
  }
}

function removeFoodById(id) {
  const idx = foodsById.get(id);
  if (idx === undefined) return;
  const lastIdx = foods.length - 1;
  if (idx !== lastIdx) {
    const lastItem = foods[lastIdx];
    foods[idx] = lastItem;
    foodsById.set(lastItem.id, idx);
  }
  foods.pop();
  foodsById.delete(id);
}

function addFoodTuple(tup) {
  const item = unpackFoodTuple(tup);
  const existingIdx = foodsById.get(item.id);
  if (existingIdx !== undefined) {
    foods[existingIdx] = item;
    return;
  }
  foodsById.set(item.id, foods.length);
  foods.push(item);
}

function sendMultiplayerInput(force = false) {
  if (!wsSocket || wsSocket.readyState !== WebSocket.OPEN || !inGame || !player || mpAwaitingJoinAck) return;
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
  mpAwaitingJoinAck = false;
  populateDenseFruits();
  bots = [];
  for (let i = 0; i < 24; i++) bots.push(spawnBot());
}

function ensureSocketInitialized() {
  if (wsSocket && (wsSocket.readyState === WebSocket.OPEN || wsSocket.readyState === WebSocket.CONNECTING)) {
    return wsSocket;
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

    // If user already clicked Start while socket was connecting, join immediately
    if (inGame && player) {
      bots = [];
      mpAwaitingJoinAck = true;
      socket.send(JSON.stringify({
        type: 'join',
        name: state.name,
        colors: player.colors,
        x: Math.round(player.x),
        y: Math.round(player.y),
        angle: Number(player.angle.toFixed(4))
      }));
    }
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
      mpAwaitingJoinAck = false;
      if (Array.isArray(msg.foods)) {
        rebuildFoodList(msg.foods);
      }
    } else if (msg.type === 'state') {
      if (!inGame || !player || mpAwaitingJoinAck) return;

      if (Array.isArray(msg.foodsFull)) {
        rebuildFoodList(msg.foodsFull);
      } else {
        if (Array.isArray(msg.eaten)) {
          for (let i = 0; i < msg.eaten.length; i++) {
            removeFoodById(msg.eaten[i]);
          }
        }
        if (Array.isArray(msg.spawned)) {
          for (let i = 0; i < msg.spawned.length; i++) {
            addFoodTuple(msg.spawned[i]);
          }
        }
      }

      if (Array.isArray(msg.players)) {
        const prevRemoteMap = new Map(remoteWorms.map(w => [w.id, w]));
        const others = [];

        for (const sp of msg.players) {
          if (sp.id === mpPlayerId) {
            mpServerPos = {
              x: sp.x,
              y: sp.y,
              angle: sp.angle,
              boosting: Boolean(isBoosting),
              at: performance.now()
            };

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
      if (inGame) activateOfflineMode();
    }
  });

  socket.addEventListener('error', () => {
    mpConnected = false;
    if (inGame) activateOfflineMode();
  });

  return socket;
}

// Pre-establish WebSocket handshake while in lobby for 0ms battle entry
setTimeout(() => {
  try { ensureSocketInitialized(); } catch (e) {}
}, 50);

function connectMultiplayer(skinColors) {
  if (offlineTimer) {
    clearTimeout(offlineTimer);
    offlineTimer = null;
  }

  offlineTimer = setTimeout(() => {
    if (!mpConnected && inGame) {
      activateOfflineMode();
    }
  }, 4500);

  try {
    const socket = ensureSocketInitialized();
    if (socket && socket.readyState === WebSocket.OPEN) {
      mpConnected = true;
      mpOfflineFallback = false;
      mpAwaitingJoinAck = true;
      bots = [];
      socket.send(JSON.stringify({
        type: 'respawn',
        name: state.name,
        colors: skinColors,
        x: Math.round(player.x),
        y: Math.round(player.y),
        angle: Number(player.angle.toFixed(4))
      }));
    }
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
  mpAwaitingJoinAck = false;
  remoteWorms = [];
  if (wsSocket) {
    try { wsSocket.close(); } catch (e) {}
    wsSocket = null;
  }
  // Re-warm socket in background for the next match
  setTimeout(() => {
    try { ensureSocketInitialized(); } catch (e) {}
  }, 150);
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
  return { x, y, t, emoji: spec.emoji, val: spec.val, r: spec.r };
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
  const angle = Math.random() * Math.PI * 2;
  const segs = [];
  for (let i = 0; i < 18; i++) {
    segs.push({
      x: x - Math.cos(angle) * i * 6,
      y: y - Math.sin(angle) * i * 6
    });
  }
  return {
    x,
    y,
    angle,
    score: 10,
    name,
    colors: skinColors,
    segments: segs,
    isPlayer,
    shieldTime: isPlayer ? 4.0 : 2.0,
    mouthTimer: 0,
    aiTimer: 0,
    aiTargetAngle: angle,
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
  const now = performance.now();
  if (now - lastStartAt < 400) return;
  lastStartAt = now;

  inGame = true;
  document.body.classList.add('in-game');
  lockLandscapeOrientation();

  document.getElementById('lobbyScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
  document.getElementById('killToastContainer').innerHTML = '';

  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  if (!arenaPattern) {
    arenaPattern = gCtx.createPattern(arenaTile, 'repeat');
  }

  const skin = SKINS.find(s => s.id === state.selectedSkin) || SKINS[0];
  const spawn = randomPointInSquareArena(500);
  player = createWorm(spawn.x, spawn.y, state.name, skin.colors, true);
  pointerAngle = player.angle;
  isBoosting = false;
  currentZoom = 1.24;
  mpServerPos = null;
  mpOfflineFallback = false;
  mpAwaitingJoinAck = true;

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

// Responsive Steering Input Handlers
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