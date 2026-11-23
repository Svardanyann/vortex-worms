const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const ARENA_HALF = 4500;
const TICK_RATE = 25;
const FOOD_COUNT = 4000;

const FRUITS = [
  { emoji: '🍒', val: 2, r: 9 },
  { emoji: '🍈', val: 3, r: 9 },
  { emoji: '🍇', val: 4, r: 10 },
  { emoji: '🍄', val: 4, r: 9 },
  { emoji: '🍓', val: 5, r: 10 },
  { emoji: '🥜', val: 6, r: 10 },
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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const httpServer = http.createServer((req, res) => {
  const cleanUrl = (req.url || '/').split('?')[0];
  let filePath = path.join(__dirname, '..', 'client', cleanUrl === '/' ? 'index.html' : cleanUrl);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, '..', 'client', 'index.html');
  }

  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ server: httpServer });

const players = new Map();
const socketsById = new Map();
let foods = [];
let respawnQueue = [];
let tickEatenIds = [];
let tickSpawnedFoods = [];
let nextFoodId = 1;
let nextPlayerId = 1;
let tickCounter = 0;

function randomArenaPos(margin = 200) {
  const limit = ARENA_HALF - margin;
  return {
    x: (Math.random() * 2 - 1) * limit,
    y: (Math.random() * 2 - 1) * limit
  };
}

function createFood(x, y, forcedIdx = null) {
  const pos = (x !== undefined && y !== undefined) ? { x, y } : randomArenaPos(160);
  const fIdx = forcedIdx !== null
    ? forcedIdx
    : Math.min(FRUITS.length - 1, Math.floor(Math.pow(Math.random(), 1.25) * FRUITS.length));
  const spec = FRUITS[fIdx];
  return {
    id: nextFoodId++,
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    t: fIdx,
    emoji: spec.emoji,
    val: spec.val,
    r: spec.r
  };
}

function packFood(f) {
  return [f.id, f.x, f.y, f.t];
}

function initFoods() {
  foods = [];
  respawnQueue = [];
  for (let i = 0; i < FOOD_COUNT; i++) {
    foods.push(createFood());
  }
}

function calcRadius(score) {
  return Math.min(30, 10.5 + Math.pow(Math.max(0, score), 0.34) * 0.78);
}

function calcSegmentsCount(score) {
  return Math.min(320, Math.floor(8 + Math.pow(Math.max(0, score), 0.56) * 1.45));
}

function updatePlayerSegmentsFromPath(p) {
  const targetSegs = calcSegmentsCount(p.score);
  const spacing = 5.2;
  if (!p.path || p.path.length === 0) {
    p.path = [{ x: p.x, y: p.y }];
  }
  p.path[0].x = p.x;
  p.path[0].y = p.y;

  const newSegs = [{ x: p.x, y: p.y }];
  let pathIdx = 0;
  let segDistAcc = 0;

  for (let s = 1; s < targetSegs; s++) {
    const targetDist = s * spacing;
    while (pathIdx < p.path.length - 1) {
      const p1 = p.path[pathIdx];
      const p2 = p.path[pathIdx + 1];
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segDistAcc + d >= targetDist && d > 0.0001) {
        const t = (targetDist - segDistAcc) / d;
        newSegs.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t
        });
        break;
      }
      segDistAcc += d;
      pathIdx++;
    }
    if (newSegs.length <= s) {
      const tailOrigin = p.path[p.path.length - 1];
      newSegs.push({ x: tailOrigin.x, y: tailOrigin.y });
    }
  }

  if (p.path.length > pathIdx + 3) {
    p.path.length = pathIdx + 3;
  }
  p.segments = newSegs;
}

function createPlayer(id, name, colors, spawnHint = null) {
  const limit = ARENA_HALF - 500;
  let spawn = randomArenaPos(500);
  let angle = Math.random() * Math.PI * 2;

  if (spawnHint && typeof spawnHint.x === 'number' && typeof spawnHint.y === 'number' &&
      Number.isFinite(spawnHint.x) && Number.isFinite(spawnHint.y)) {
    spawn = {
      x: Math.max(-limit, Math.min(limit, spawnHint.x)),
      y: Math.max(-limit, Math.min(limit, spawnHint.y))
    };
  }
  if (spawnHint && typeof spawnHint.angle === 'number' && Number.isFinite(spawnHint.angle)) {
    angle = spawnHint.angle;
  }

  const segments = [];
  for (let i = 0; i < 8; i++) {
    segments.push({ x: spawn.x, y: spawn.y });
  }

  return {
    id,
    name: (name || 'Player').slice(0, 16),
    colors: Array.isArray(colors) && colors.length >= 2 ? colors : ['#ffffff', '#38bdf8'],
    x: spawn.x,
    y: spawn.y,
    angle,
    targetAngle: angle,
    boosting: false,
    score: 0,
    kills: 0,
    shield: 4.0,
    path: [{ x: spawn.x, y: spawn.y }],
    segments,
    alive: true
  };
}

function spawnOrRespawnSocketPlayer(ws, id, msg, existingPlayer) {
  const fresh = createPlayer(
    id,
    msg.name || (existingPlayer && existingPlayer.name),
    msg.colors || (existingPlayer && existingPlayer.colors),
    { x: msg.x, y: msg.y, angle: msg.angle }
  );
  players.set(id, fresh);
  socketsById.set(id, ws);
  ws.send(JSON.stringify({
    type: 'joined',
    id,
    arenaHalf: ARENA_HALF,
    foods: foods.map(packFood)
  }));
  return fresh;
}

wss.on('connection', (ws) => {
  const id = nextPlayerId++;
  let player = null;
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'join' || msg.type === 'respawn') {
      player = spawnOrRespawnSocketPlayer(ws, id, msg, player);
    } else if (msg.type === 'input' && player && player.alive) {
      if (typeof msg.angle === 'number' && Number.isFinite(msg.angle)) {
        player.targetAngle = msg.angle;
      }
      player.boosting = Boolean(msg.boosting);
    }
  });

  ws.on('close', () => {
    players.delete(id);
    socketsById.delete(id);
  });

  ws.on('error', () => {
    players.delete(id);
    socketsById.delete(id);
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 20000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

function killPlayer(victim, killer) {
  if (!victim || !victim.alive) return;
  victim.alive = false;

  const watermelonIdx = FRUITS.length - 1;
  for (let i = 0; i < victim.segments.length; i += 2) {
    const seg = victim.segments[i];
    if (foods.length < 5200) {
      const drop = createFood(
        seg.x + (Math.random() - 0.5) * 18,
        seg.y + (Math.random() - 0.5) * 18,
        watermelonIdx
      );
      foods.push(drop);
      tickSpawnedFoods.push(packFood(drop));
    }
  }

  if (killer && killer.id !== victim.id && killer.alive) {
    killer.kills += 1;
    const killerWs = socketsById.get(killer.id);
    if (killerWs && killerWs.readyState === 1) {
      killerWs.send(JSON.stringify({ type: 'kill_credit', victimName: victim.name }));
    }
  }
}

function stepSimulation(dt) {
  for (let i = respawnQueue.length - 1; i >= 0; i--) {
    respawnQueue[i].timer -= dt;
    if (respawnQueue[i].timer <= 0) {
      const nf = createFood();
      foods.push(nf);
      tickSpawnedFoods.push(packFood(nf));
      respawnQueue.splice(i, 1);
    }
  }

  const activePlayers = Array.from(players.values()).filter((p) => p.alive);

  for (const p of activePlayers) {
    if (p.shield > 0) {
      p.shield = Math.max(0, p.shield - dt);
    }

    const r = calcRadius(p.score);
    const canBoost = p.boosting && p.score > 5;
    const speed = canBoost ? 280 : 160;

    let diff = p.targetAngle - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const sizeFactor = Math.max(0.75, 10.5 / r);
    const maxTurnRate = 9.0 * sizeFactor;
    const step = diff * Math.min(1, dt * 22);
    p.angle += Math.max(-maxTurnRate * dt, Math.min(maxTurnRate * dt, step));

    if (canBoost) {
      p.score = Math.max(0, p.score - dt * 5);
    }

    p.x += Math.cos(p.angle) * speed * dt;
    p.y += Math.sin(p.angle) * speed * dt;

    if (Math.hypot(p.x - p.path[0].x, p.y - p.path[0].y) >= 1.2) {
      p.path.unshift({ x: p.x, y: p.y });
    } else {
      p.path[0].x = p.x;
      p.path[0].y = p.y;
    }

    if (Math.abs(p.x) >= ARENA_HALF - r || Math.abs(p.y) >= ARENA_HALF - r) {
      const ws = socketsById.get(p.id);
      killPlayer(p, null);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'died', score: Math.floor(p.score), kills: p.kills }));
      }
      continue;
    }

    updatePlayerSegmentsFromPath(p);

    const eatR = r + 14;
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      if (dx * dx + dy * dy < eatR * eatR) {
        p.score += f.val;
        tickEatenIds.push(f.id);
        foods.splice(i, 1);
        if (foods.length + respawnQueue.length < FOOD_COUNT) {
          respawnQueue.push({ timer: 1.2 + Math.random() * 1.2 });
        }
      }
    }
  }

  const stillAlive = Array.from(players.values()).filter((p) => p.alive);
  for (const p1 of stillAlive) {
    if (!p1.alive || p1.shield > 0) continue;
    const r1 = calcRadius(p1.score) * 0.78;

    for (const p2 of stillAlive) {
      if (p1.id === p2.id || !p2.alive) continue;
      const r2 = calcRadius(p2.score) * 0.78;

      for (let s = 2; s < p2.segments.length; s++) {
        const seg = p2.segments[s];
        const dx = p1.x - seg.x;
        const dy = p1.y - seg.y;
        if (dx * dx + dy * dy < (r1 + r2) * (r1 + r2)) {
          const ws1 = socketsById.get(p1.id);
          killPlayer(p1, p2);
          if (ws1 && ws1.readyState === 1) {
            ws1.send(JSON.stringify({ type: 'died', score: Math.floor(p1.score), kills: p1.kills }));
          }
          break;
        }
      }
      if (!p1.alive) break;
    }
  }
}

function broadcastState() {
  tickCounter++;
  const snapshotPlayers = Array.from(players.values())
    .filter((p) => p.alive)
    .map((p) => ({
      id: p.id,
      name: p.name,
      colors: p.colors,
      x: Math.round(p.x),
      y: Math.round(p.y),
      angle: Number(p.angle.toFixed(3)),
      score: Math.floor(p.score),
      shield: Number(p.shield.toFixed(1)),
      segments: p.segments.map((s) => ({ x: Math.round(s.x), y: Math.round(s.y) }))
    }));

  const stateMsg = {
    type: 'state',
    players: snapshotPlayers
  };

  if (tickEatenIds.length > 0) {
    stateMsg.eaten = tickEatenIds;
  }
  if (tickSpawnedFoods.length > 0) {
    stateMsg.spawned = tickSpawnedFoods;
  }
  if (tickCounter % 100 === 0) {
    stateMsg.foodsFull = foods.map(packFood);
  }

  tickEatenIds = [];
  tickSpawnedFoods = [];

  const payload = JSON.stringify(stateMsg);
  for (const ws of socketsById.values()) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

initFoods();

let lastTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  stepSimulation(dt);
  broadcastState();
}, 1000 / TICK_RATE);

httpServer.listen(PORT, () => {
  console.log(`Vortex Worms server running on http://localhost:${PORT}`);
});