const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const ARENA_HALF = 3000;
const TICK_RATE = 20;
const GRID_SIZE = 6; // 6x6 = 36 zones for balanced random fruit distribution
const ZONE_SPAN = (ARENA_HALF * 2) / GRID_SIZE;
const MIN_FRUITS_PER_ZONE = 16;
const MAX_FRUITS_PER_ZONE = 28;
const POWERUP_COUNT = 38;
const COIN_COUNT = 8;
const BOT_COUNT = 5;

// Weighted powerup pool: Magnet appears 3x more often
const POWERUP_POOL = ['magnet', 'magnet', 'magnet', 'zoom', 'freeBoost'];
const POWERUP_TYPES = ['magnet', 'zoom', 'freeBoost'];

const BOT_NAMES = [
  'Արամ', 'Անի', 'Դավիթ', 'Max', 'Nika',
  'Leo', 'Տիգրան', 'Alex', 'Մհեր', 'Kira',
  'Նարե', 'Saro'
];

const BOT_SKINS = [
  ['#ffffff', '#e2e8f0', '#38bdf8'],
  ['#10b981', '#059669', '#a7f3d0'],
  ['#f97316', '#ef4444', '#facc15'],
  ['#a855f7', '#ec4899', '#38bdf8'],
  ['#fbbf24', '#d97706', '#fef08a'],
  ['#ef4444', '#22c55e', '#15803d']
];

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
const rooms = new Map();
let nextPlayerId = 1;

function randomArenaPos(margin = 200) {
  const limit = ARENA_HALF - margin;
  return {
    x: Math.round((Math.random() * 2 - 1) * limit),
    y: Math.round((Math.random() * 2 - 1) * limit)
  };
}

function getZoneIndex(x, y) {
  const gx = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((x + ARENA_HALF) / ZONE_SPAN)));
  const gy = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((y + ARENA_HALF) / ZONE_SPAN)));
  return gy * GRID_SIZE + gx;
}

function randomPosInZone(zoneIdx, margin = 95) {
  const gx = zoneIdx % GRID_SIZE;
  const gy = Math.floor(zoneIdx / GRID_SIZE);
  const minX = -ARENA_HALF + gx * ZONE_SPAN + (gx === 0 ? margin : 16);
  const maxX = -ARENA_HALF + (gx + 1) * ZONE_SPAN - (gx === GRID_SIZE - 1 ? margin : 16);
  const minY = -ARENA_HALF + gy * ZONE_SPAN + (gy === 0 ? margin : 16);
  const maxY = -ARENA_HALF + (gy + 1) * ZONE_SPAN - (gy === GRID_SIZE - 1 ? margin : 16);
  return {
    x: Math.round(minX + Math.random() * Math.max(12, maxX - minX)),
    y: Math.round(minY + Math.random() * Math.max(12, maxY - minY))
  };
}

function packFood(f) {
  return [f.id, f.x, f.y, f.t];
}

function createRoom(code, isPrivate = false) {
  const room = {
    code,
    isPrivate,
    players: new Map(),
    socketsById: new Map(),
    foods: new Map(),
    zoneCounts: new Array(GRID_SIZE * GRID_SIZE).fill(0),
    powerups: [],
    coins: [],
    respawnQueue: [],
    tickEatenIds: [],
    tickSpawnedFoods: [],
    tickPowerupsDirty: false,
    tickCoinsDirty: false,
    nextFoodId: 1,
    nextPowerupId: 1,
    nextCoinId: 1,
    tickCounter: 0
  };

  for (let z = 0; z < GRID_SIZE * GRID_SIZE; z++) {
    const count = MIN_FRUITS_PER_ZONE + Math.floor(Math.random() * (MAX_FRUITS_PER_ZONE - MIN_FRUITS_PER_ZONE + 1));
    for (let i = 0; i < count; i++) {
      spawnRoomFood(room, z, false);
    }
  }
  for (let i = 0; i < POWERUP_COUNT; i++) {
    room.powerups.push(createRoomPowerup(room));
  }
  for (let i = 0; i < COIN_COUNT; i++) {
    room.coins.push(createRoomCoin(room));
  }

  rooms.set(code, room);
  return room;
}

function spawnRoomFood(room, preferredZone = null, recordTick = true, customPos = null, forcedIdx = null) {
  let zone = preferredZone;
  if (zone === null && !customPos) {
    let minC = Infinity;
    const lowest = [];
    for (let z = 0; z < room.zoneCounts.length; z++) {
      if (room.zoneCounts[z] < minC) {
        minC = room.zoneCounts[z];
        lowest.length = 0;
        lowest.push(z);
      } else if (room.zoneCounts[z] === minC) {
        lowest.push(z);
      }
    }
    zone = lowest[Math.floor(Math.random() * lowest.length)];
  }

  const pos = customPos || randomPosInZone(zone);
  const actualZone = getZoneIndex(pos.x, pos.y);
  const fIdx = forcedIdx !== null
    ? forcedIdx
    : Math.min(FRUITS.length - 1, Math.floor(Math.pow(Math.random(), 1.25) * FRUITS.length));
  const spec = FRUITS[fIdx];
  const food = {
    id: room.nextFoodId++,
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    t: fIdx,
    val: spec.val,
    r: spec.r,
    zone: actualZone
  };
  room.foods.set(food.id, food);
  room.zoneCounts[actualZone]++;
  if (recordTick) room.tickSpawnedFoods.push(packFood(food));
  return food;
}

function removeRoomFood(room, id) {
  const f = room.foods.get(id);
  if (!f) return null;
  room.foods.delete(id);
  room.zoneCounts[f.zone] = Math.max(0, room.zoneCounts[f.zone] - 1);
  room.tickEatenIds.push(id);
  return f;
}

function createRoomPowerup(room) {
  const pos = randomArenaPos(260);
  const type = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
  return {
    id: room.nextPowerupId++,
    x: pos.x,
    y: pos.y,
    type
  };
}

function createRoomCoin(room) {
  const pos = randomArenaPos(280);
  return {
    id: room.nextCoinId++,
    x: pos.x,
    y: pos.y,
    val: Math.random() < 0.25 ? 2 : 1
  };
}

function findSafeSpawnPos(room, margin = 500, minDist = 450) {
  let candidate = randomArenaPos(margin);
  for (let attempt = 0; attempt < 25; attempt++) {
    candidate = randomArenaPos(margin);
    let tooClose = false;
    for (const p of room.players.values()) {
      if (!p.alive) continue;
      if (Math.hypot(p.x - candidate.x, p.y - candidate.y) < minDist) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) return candidate;
  }
  return candidate;
}

function calcRadius(score) {
  return Math.min(30, 10.5 + Math.pow(Math.max(0, score), 0.34) * 0.78);
}

function calcSegmentsCount(score) {
  return Math.min(560, Math.floor(14 + Math.pow(Math.max(0, score), 0.56) * 2.5));
}

function updatePlayerSegmentsFromPath(p) {
  const targetSegs = calcSegmentsCount(p.score);
  const r = calcRadius(p.score);
  const spacing = Math.max(2.6, r * 0.22);
  if (!p.path || p.path.length === 0) p.path = [{ x: p.x, y: p.y }];
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

  if (p.path.length > pathIdx + 3) p.path.length = pathIdx + 3;
  p.segments = newSegs;
}

function createPlayer(room, id, name, colors, spawnHint = null) {
  const limit = ARENA_HALF - 500;
  let spawn = findSafeSpawnPos(room, 500, 450);
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

  const initSegs = 14;
  const spacing = Math.max(2.6, calcRadius(0) * 0.22);
  const pathPts = [];
  const segments = [];
  for (let i = 0; i < initSegs; i++) {
    const pt = {
      x: spawn.x - Math.cos(angle) * i * spacing,
      y: spawn.y - Math.sin(angle) * i * spacing
    };
    pathPts.push(pt);
    segments.push({ ...pt });
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
    isBoostingNow: false,
    isBot: false,
    score: 0,
    kills: 0,
    shield: 4.0,
    age: 0,
    inventory: { magnet: 0, zoom: 0, freeBoost: 0 },
    effects: { magnet: 0, zoom: 0, freeBoost: 0 },
    path: pathPts,
    segments,
    alive: true
  };
}

function createBot(room) {
  const id = nextPlayerId++;
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const colors = BOT_SKINS[Math.floor(Math.random() * BOT_SKINS.length)];
  const bot = createPlayer(room, id, name, colors);
  bot.isBot = true;
  bot.shield = 2.0;
  bot.score = 15 + Math.floor(Math.random() * 140);
  bot.aiTimer = 0.4 + Math.random() * 1.0;
  bot.aiTargetAngle = bot.angle;

  const targetSegs = calcSegmentsCount(bot.score);
  const spacing = Math.max(2.6, calcRadius(bot.score) * 0.22);
  bot.path = [];
  bot.segments = [];
  for (let i = 0; i < targetSegs; i++) {
    const pt = {
      x: bot.x - Math.cos(bot.angle) * i * spacing,
      y: bot.y - Math.sin(bot.angle) * i * spacing
    };
    bot.path.push(pt);
    bot.segments.push({ ...pt });
  }
  return bot;
}

function maintainRoomBots(room) {
  if (room.isPrivate) return;
  let aliveBots = 0;
  for (const [id, p] of room.players.entries()) {
    if (p.isBot) {
      if (p.alive) aliveBots++;
      else room.players.delete(id);
    }
  }
  while (aliveBots < BOT_COUNT) {
    const bot = createBot(room);
    room.players.set(bot.id, bot);
    aliveBots++;
  }
}

function updateBotAI(room, bot, dt, allAlive) {
  bot.aiTimer -= dt;

  const wallMargin = 420;
  if (bot.x > ARENA_HALF - wallMargin || bot.x < -ARENA_HALF + wallMargin ||
      bot.y > ARENA_HALF - wallMargin || bot.y < -ARENA_HALF + wallMargin) {
    bot.aiTargetAngle = Math.atan2(-bot.y, -bot.x);
    bot.boosting = false;
    bot.targetAngle = bot.aiTargetAngle;
    return;
  }

  for (const other of allAlive) {
    if (other.id === bot.id || !other.alive) continue;
    const hdx = bot.x - other.x;
    const hdy = bot.y - other.y;
    if (hdx * hdx + hdy * hdy < 130 * 130) {
      bot.aiTargetAngle = Math.atan2(hdy, hdx);
      bot.boosting = false;
      bot.targetAngle = bot.aiTargetAngle;
      return;
    }
  }

  const lookX = bot.x + Math.cos(bot.angle) * 95;
  const lookY = bot.y + Math.sin(bot.angle) * 95;
  let dangerWorm = null;
  for (const other of allAlive) {
    if (other.id === bot.id || !other.alive) continue;
    for (let s = 0; s < other.segments.length; s += 3) {
      const seg = other.segments[s];
      const dx = lookX - seg.x;
      const dy = lookY - seg.y;
      if (dx * dx + dy * dy < 110 * 110) {
        dangerWorm = seg;
        break;
      }
    }
    if (dangerWorm) break;
  }

  if (dangerWorm) {
    bot.aiTargetAngle = Math.atan2(bot.y - dangerWorm.y, bot.x - dangerWorm.x);
    bot.boosting = false;
    bot.targetAngle = bot.aiTargetAngle;
    return;
  }

  if (bot.aiTimer <= 0) {
    bot.aiTimer = 0.55 + Math.random() * 1.15;
    let bestFood = null;
    let bestDistSq = 280 * 280;
    let step = 0;
    for (const f of room.foods.values()) {
      if ((step++ % 4) !== 0) continue;
      const dx = f.x - bot.x;
      const dy = f.y - bot.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestFood = f;
      }
    }
    if (bestFood) {
      bot.aiTargetAngle = Math.atan2(bestFood.y - bot.y, bestFood.x - bot.x);
    } else {
      bot.aiTargetAngle = bot.angle + (Math.random() - 0.5) * 1.5;
    }
    bot.boosting = bot.score > 30 && Math.random() < 0.14;
  }

  bot.targetAngle = bot.aiTargetAngle;
}

function broadcastRoomPeers(room) {
  if (!room || !room.isPrivate) return;
  const peers = [];
  for (const p of room.players.values()) {
    if (!p.isBot) peers.push({ id: p.id, name: p.name });
  }
  const msg = JSON.stringify({ type: 'room_peers', roomCode: room.code, peers });
  for (const ws of room.socketsById.values()) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

function leaveCurrentRoom(ws, id) {
  const room = ws.currentRoom;
  if (!room) return;
  room.players.delete(id);
  room.socketsById.delete(id);
  ws.currentRoom = null;
  if (room.isPrivate) {
    let humans = 0;
    for (const p of room.players.values()) {
      if (!p.isBot) humans++;
    }
    if (humans === 0) {
      rooms.delete(room.code);
    } else {
      broadcastRoomPeers(room);
    }
  }
}

function spawnOrRespawnSocketPlayer(ws, id, msg, existingPlayer) {
  const requestedCode = String(msg.roomCode || '').trim();
  let targetRoom = publicRoom;

  if (requestedCode && requestedCode !== 'PUBLIC') {
    if (!rooms.has(requestedCode)) {
      ws.send(JSON.stringify({ type: 'room_error', reason: 'not_found' }));
      return null;
    }
    targetRoom = rooms.get(requestedCode);
  }

  if (ws.currentRoom && ws.currentRoom !== targetRoom) {
    leaveCurrentRoom(ws, id);
  }

  ws.currentRoom = targetRoom;
  const fresh = createPlayer(
    targetRoom,
    id,
    msg.name || (existingPlayer && existingPlayer.name),
    msg.colors || (existingPlayer && existingPlayer.colors),
    { x: msg.x, y: msg.y, angle: msg.angle }
  );
  targetRoom.players.set(id, fresh);
  targetRoom.socketsById.set(id, ws);

  const packedFoods = [];
  for (const f of targetRoom.foods.values()) {
    packedFoods.push(packFood(f));
  }

  ws.send(JSON.stringify({
    type: 'joined',
    id,
    roomCode: targetRoom.code,
    isPrivate: targetRoom.isPrivate,
    arenaHalf: ARENA_HALF,
    foods: packedFoods,
    powerups: targetRoom.powerups,
    coins: targetRoom.coins
  }));

  if (targetRoom.isPrivate) {
    broadcastRoomPeers(targetRoom);
  }
  return fresh;
}

const publicRoom = createRoom('PUBLIC', false);
maintainRoomBots(publicRoom);

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

    if (msg.type === 'create_room') {
      const code = String(msg.roomCode || '').trim();
      if (!/^\d{5}$/.test(code)) {
        ws.send(JSON.stringify({ type: 'room_error', reason: 'invalid_code' }));
        return;
      }
      if (rooms.has(code)) {
        ws.send(JSON.stringify({ type: 'room_error', reason: 'code_taken' }));
        return;
      }
      createRoom(code, true);
      ws.send(JSON.stringify({ type: 'room_created', roomCode: code }));
      return;
    }

    if (msg.type === 'check_room') {
      const code = String(msg.roomCode || '').trim();
      if (!rooms.has(code) || code === 'PUBLIC') {
        ws.send(JSON.stringify({ type: 'room_error', reason: 'not_found' }));
        return;
      }
      ws.send(JSON.stringify({ type: 'room_ready', roomCode: code }));
      return;
    }

    if (msg.type === 'join' || msg.type === 'respawn') {
      player = spawnOrRespawnSocketPlayer(ws, id, msg, player);
      return;
    }

    if (msg.type === 'leave') {
      leaveCurrentRoom(ws, id);
      player = null;
      return;
    }

    const room = ws.currentRoom;
    if (!room || !player) return;

    if (msg.type === 'input' && player.alive) {
      if (typeof msg.angle === 'number' && Number.isFinite(msg.angle)) {
        player.targetAngle = msg.angle;
      }
      player.boosting = Boolean(msg.boosting);
    } else if (msg.type === 'eat_food' && player.alive && Array.isArray(msg.ids)) {
      const rHead = calcRadius(player.score);
      const maxReach = rHead + (player.effects.magnet > 0 ? 220 : 52);
      for (let i = 0; i < msg.ids.length; i++) {
        const f = room.foods.get(msg.ids[i]);
        if (!f) continue;
        if (Math.hypot(player.x - f.x, player.y - f.y) <= maxReach) {
          removeRoomFood(room, f.id);
          player.score += f.val;
          room.respawnQueue.push({ timer: 1.0 + Math.random() * 1.1 });
        }
      }
    } else if (msg.type === 'use_powerup' && player.alive) {
      const pType = msg.powerup;
      if (POWERUP_TYPES.includes(pType) && player.inventory[pType] > 0) {
        player.inventory[pType] -= 1;
        player.effects[pType] = 12.0;
        ws.send(JSON.stringify({
          type: 'powerup_state',
          inventory: player.inventory,
          effects: player.effects
        }));
      }
    } else if (msg.type === 'rtc_signal' && msg.to && room.isPrivate) {
      const targetWs = room.socketsById.get(Number(msg.to));
      if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({ type: 'rtc_signal', from: id, signal: msg.signal }));
      }
    }
  });

  ws.on('close', () => {
    leaveCurrentRoom(ws, id);
  });

  ws.on('error', () => {
    leaveCurrentRoom(ws, id);
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 20000);

wss.on('close', () => clearInterval(heartbeatInterval));

function killRoomPlayer(room, victim, killer) {
  if (!victim || !victim.alive) return;
  victim.alive = false;

  // Drop a colorful trail of high-value fruits instead of identical watermelons
  const highTierStart = Math.max(8, FRUITS.length - 12);
  for (let i = 0; i < victim.segments.length; i += 4) {
    const seg = victim.segments[i];
    if (room.foods.size < 2600) {
      const dropIdx = highTierStart + (i % (FRUITS.length - highTierStart));
      spawnRoomFood(room, null, true, {
        x: Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(seg.x + (Math.random() - 0.5) * 14))),
        y: Math.max(-ARENA_HALF + 80, Math.min(ARENA_HALF - 80, Math.round(seg.y + (Math.random() - 0.5) * 14)))
      }, dropIdx);
    }
  }

  if (killer && killer.id !== victim.id && killer.alive) {
    killer.kills += 1;
    const killerWs = room.socketsById.get(killer.id);
    if (killerWs && killerWs.readyState === 1) {
      killerWs.send(JSON.stringify({ type: 'kill_credit', victimName: victim.name }));
    }
  }
}

function stepRoomSimulation(room, dt) {
  maintainRoomBots(room);

  for (let i = room.respawnQueue.length - 1; i >= 0; i--) {
    room.respawnQueue[i].timer -= dt;
    if (room.respawnQueue[i].timer <= 0) {
      spawnRoomFood(room, null, true);
      room.respawnQueue.splice(i, 1);
    }
  }

  while (room.powerups.length < POWERUP_COUNT) {
    room.powerups.push(createRoomPowerup(room));
    room.tickPowerupsDirty = true;
  }
  while (room.coins.length < COIN_COUNT) {
    room.coins.push(createRoomCoin(room));
    room.tickCoinsDirty = true;
  }

  const activePlayers = Array.from(room.players.values()).filter((p) => p.alive);

  for (const p of activePlayers) {
    p.age = (p.age || 0) + dt;
    if (p.shield > 0) p.shield = Math.max(0, p.shield - dt);
    for (const k of POWERUP_TYPES) {
      if (p.effects[k] > 0) p.effects[k] = Math.max(0, p.effects[k] - dt);
    }

    if (p.isBot) {
      updateBotAI(room, p, dt, activePlayers);
    }

    const r = calcRadius(p.score);
    const hasFreeBoost = p.effects.freeBoost > 0;
    const canBoost = hasFreeBoost || (p.boosting && p.score > 1);
    p.isBoostingNow = canBoost;
    const speed = canBoost ? 280 : 160;

    let diff = p.targetAngle - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const turnRadius = p.isBot ? (r * 1.65) : (r * 0.98);
    const maxStep = (speed / turnRadius) * dt;
    p.angle = Math.abs(diff) <= maxStep ? p.targetAngle : p.angle + Math.sign(diff) * maxStep;

    if (canBoost && !hasFreeBoost) {
      p.score = Math.max(0, p.score - dt * 1);
    }

    p.x += Math.cos(p.angle) * speed * dt;
    p.y += Math.sin(p.angle) * speed * dt;

    if (Math.hypot(p.x - p.path[0].x, p.y - p.path[0].y) >= 0.8) {
      p.path.unshift({ x: p.x, y: p.y });
    } else {
      p.path[0].x = p.x;
      p.path[0].y = p.y;
    }

    if (Math.abs(p.x) >= ARENA_HALF - r || Math.abs(p.y) >= ARENA_HALF - r) {
      const ws = room.socketsById.get(p.id);
      killRoomPlayer(room, p, null);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'died', score: Math.floor(p.score), kills: p.kills }));
      }
      continue;
    }

    updatePlayerSegmentsFromPath(p);

    const puEatR = r + 18;
    for (let i = room.powerups.length - 1; i >= 0; i--) {
      const pu = room.powerups[i];
      const dx = p.x - pu.x;
      const dy = p.y - pu.y;
      if (dx * dx + dy * dy < puEatR * puEatR) {
        if (!p.isBot) {
          p.inventory[pu.type] = (p.inventory[pu.type] || 0) + 1;
          const ws = room.socketsById.get(p.id);
          if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'powerup_state',
              picked: pu.type,
              inventory: p.inventory,
              effects: p.effects
            }));
          }
        }
        room.powerups.splice(i, 1);
        room.tickPowerupsDirty = true;
      }
    }

    if (!p.isBot) {
      for (let i = room.coins.length - 1; i >= 0; i--) {
        const c = room.coins[i];
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        if (dx * dx + dy * dy < puEatR * puEatR) {
          const ws = room.socketsById.get(p.id);
          if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'coin_picked', amount: c.val, x: c.x, y: c.y }));
          }
          room.coins.splice(i, 1);
          room.tickCoinsDirty = true;
        }
      }
    }

    if (p.isBot) {
      const eatR = r + 14;
      for (const f of room.foods.values()) {
        const dx = p.x - f.x;
        const dy = p.y - f.y;
        if (dx * dx + dy * dy < eatR * eatR) {
          p.score += f.val;
          removeRoomFood(room, f.id);
          room.respawnQueue.push({ timer: 1.2 + Math.random() * 1.2 });
          break;
        }
      }
    }
  }

  const stillAlive = Array.from(room.players.values()).filter((p) => p.alive);
  for (const p1 of stillAlive) {
    if (!p1.alive || p1.shield > 0) continue;
    const r1 = calcRadius(p1.score) * 0.78;
    for (const p2 of stillAlive) {
      if (p1.id === p2.id || !p2.alive) continue;
      const r2 = calcRadius(p2.score) * 0.78;
      for (let s = 4; s < p2.segments.length; s += 2) {
        const seg = p2.segments[s];
        const dx = p1.x - seg.x;
        const dy = p1.y - seg.y;
        if (dx * dx + dy * dy < (r1 + r2) * (r1 + r2)) {
          const ws1 = room.socketsById.get(p1.id);
          killRoomPlayer(room, p1, p2);
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

function broadcastRoomState(room) {
  if (room.socketsById.size === 0) return;
  room.tickCounter++;
  const periodicSync = room.tickCounter % (TICK_RATE * 3) === 0;

  const snapshotPlayers = Array.from(room.players.values())
    .filter((p) => p.alive)
    .map((p) => {
      const includeSegs = p.age < 1.2 || periodicSync;
      const compactSegs = [];
      if (includeSegs) {
        for (let i = 0; i < p.segments.length; i += 3) {
          compactSegs.push({ x: Math.round(p.segments[i].x), y: Math.round(p.segments[i].y) });
        }
      }
      return {
        id: p.id,
        name: p.name,
        colors: p.colors,
        x: Math.round(p.x),
        y: Math.round(p.y),
        angle: Number(p.angle.toFixed(3)),
        boosting: Boolean(p.isBoostingNow),
        score: Math.floor(p.score),
        shield: Number(p.shield.toFixed(1)),
        segments: compactSegs
      };
    });

  const stateMsg = { type: 'state', players: snapshotPlayers };
  if (room.tickEatenIds.length > 0) stateMsg.eaten = room.tickEatenIds;
  if (room.tickSpawnedFoods.length > 0) stateMsg.spawned = room.tickSpawnedFoods;
  if (room.tickPowerupsDirty) stateMsg.powerups = room.powerups;
  if (room.tickCoinsDirty) stateMsg.coins = room.coins;

  room.tickEatenIds = [];
  room.tickSpawnedFoods = [];
  room.tickPowerupsDirty = false;
  room.tickCoinsDirty = false;

  const payload = JSON.stringify(stateMsg);
  for (const ws of room.socketsById.values()) {
    if (ws.readyState === 1) ws.send(payload);
  }
}

let lastTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.06, (now - lastTime) / 1000);
  lastTime = now;
  for (const room of rooms.values()) {
    stepRoomSimulation(room, dt);
    broadcastRoomState(room);
  }
}, 1000 / TICK_RATE);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Vortex Worms server running on http://0.0.0.0:${PORT}`);
});