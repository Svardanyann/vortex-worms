// ================= GAME LOOP & RENDERING =================
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

// ================= POWER-UPS (MAGNET, TELESCOPE ZOOM, SPEED BOOST) =================
const POWERUP_SPECS = {
  magnet: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    label: 'Մագնիս',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3v7a6 6 0 0 0 12 0V3"/>
      <line x1="6" y1="7" x2="10" y2="7"/>
      <line x1="14" y1="7" x2="18" y2="7"/>
    </svg>`
  },
  zoom: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    label: 'Հեռադիտակ',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21 7-9.5 4.5-3.5-2L3 12l2 3.5 5-2 3.5 2L21 11Z"/>
      <path d="M12 15v6"/>
      <path d="m9 21 3-3 3 3"/>
    </svg>`
  },
  freeBoost: {
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.45)',
    label: 'Արագացում',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>`
  }
};

const POWERUP_DURATION = 12.0;
const OFFLINE_POWERUP_COUNT = 45;
let localPowerups = [];
let playerPowerupInv = { magnet: 0, zoom: 0, freeBoost: 0 };

function createLocalPowerup() {
  const keys = Object.keys(POWERUP_SPECS);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const pos = randomPointInSquareArena(260);
  return {
    id: Math.random(),
    x: pos.x,
    y: pos.y,
    type
  };
}

function ensureLocalPowerups() {
  while (localPowerups.length < OFFLINE_POWERUP_COUNT) {
    localPowerups.push(createLocalPowerup());
  }
}

function ensurePowerupHudBar() {
  let bar = document.getElementById('powerupActionBar');
  if (bar) return bar;

  if (!document.getElementById('powerupActionBarStyle')) {
    const style = document.createElement('style');
    style.id = 'powerupActionBarStyle';
    style.textContent = `
      #powerupActionBar {
        position: fixed;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        align-items: center;
        gap: 14px;
        z-index: 45;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(10, 22, 34, 0.52);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        user-select: none;
        touch-action: manipulation;
      }
      .pu-slot-btn {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.25);
        background: rgba(15, 30, 46, 0.85);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.14s ease, box-shadow 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
        padding: 0;
      }
      .pu-slot-btn.available {
        opacity: 1;
        border-color: var(--pu-color);
        box-shadow: 0 0 14px var(--pu-glow);
      }
      .pu-slot-btn.available:active {
        transform: scale(0.9);
      }
      .pu-slot-btn.active-effect {
        border-color: #fff;
        box-shadow: 0 0 18px var(--pu-color), inset 0 0 10px var(--pu-glow);
        animation: puPulse 1s infinite alternate;
      }
      .pu-slot-btn.empty {
        opacity: 0.42;
        cursor: default;
      }
      .pu-count-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 19px;
        height: 19px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--pu-color);
        color: #09131d;
        font-size: 11px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid #09131d;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      }
      .pu-timer-badge {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        padding: 1px 6px;
        border-radius: 999px;
        background: #fff;
        color: #09131d;
        font-size: 10px;
        font-weight: 900;
        display: none;
      }
      .pu-slot-btn.active-effect .pu-timer-badge {
        display: block;
      }
      @keyframes puPulse {
        from { transform: scale(1); }
        to { transform: scale(1.07); }
      }
    `;
    document.head.appendChild(style);
  }

  bar = document.createElement('div');
  bar.id = 'powerupActionBar';

  ['magnet', 'zoom', 'freeBoost'].forEach((type) => {
    const spec = POWERUP_SPECS[type];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pu-slot-btn empty';
    btn.dataset.puType = type;
    btn.title = spec.label;
    btn.style.setProperty('--pu-color', spec.color);
    btn.style.setProperty('--pu-glow', spec.glow);
    btn.innerHTML = `
      <span style="color:${spec.color};display:flex;align-items:center;justify-content:center;">${spec.svg}</span>
      <span class="pu-count-badge">0</span>
      <span class="pu-timer-badge">12s</span>
    `;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      activatePlayerPowerup(type);
    });
    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
  return bar;
}

function activatePlayerPowerup(type) {
  if (!inGame || !player) return;
  const count = playerPowerupInv[type] || 0;
  if (count <= 0) {
    playTone(210, 'sine', 0.06, 0.04);
    return;
  }

  playerPowerupInv[type] = count - 1;
  player.effects[type] = POWERUP_DURATION;
  playTone(680, 'triangle', 0.12, 0.07);

  if (typeof mpConnected !== 'undefined' && mpConnected && typeof wsSocket !== 'undefined' && wsSocket && wsSocket.readyState === 1) {
  wsSocket.send(JSON.stringify({ type: 'use_powerup', powerup: type }));
}

  const spec = POWERUP_SPECS[type];
  floatingTexts.push({
    x: player.x,
    y: player.y - 24,
    text: spec ? spec.label : type,
    alpha: 1.0,
    color: spec ? spec.color : '#ffd166'
  });

  updatePowerupHudBar();
}

function updatePowerupHudBar() {
  const bar = ensurePowerupHudBar();
  if (!inGame || !player) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';

  bar.querySelectorAll('.pu-slot-btn').forEach((btn) => {
    const type = btn.dataset.puType;
    const count = playerPowerupInv[type] || 0;
    const rem = (player.effects && player.effects[type]) || 0;
    const countEl = btn.querySelector('.pu-count-badge');
    const timerEl = btn.querySelector('.pu-timer-badge');

    countEl.textContent = count;
    btn.classList.toggle('available', count > 0);
    btn.classList.toggle('empty', count <= 0 && rem <= 0);
    btn.classList.toggle('active-effect', rem > 0);

    if (rem > 0) {
      timerEl.textContent = `${Math.ceil(rem)}s`;
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (!inGame || !player) return;
  if (e.key === '1') activatePlayerPowerup('magnet');
  if (e.key === '2') activatePlayerPowerup('zoom');
  if (e.key === '3') activatePlayerPowerup('freeBoost');
});

// Hook into multiplayer messages seamlessly if mpSocket exists
let hookedMpSocket = null;
function syncMultiplayerPowerupHook() {
  if (typeof wsSocket === 'undefined' || !wsSocket || wsSocket === hookedMpSocket) return;
  hookedMpSocket = wsSocket;
  wsSocket.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'joined') {
        playerPowerupInv = { magnet: 0, zoom: 0, freeBoost: 0 };
        if (Array.isArray(msg.powerups)) {
          localPowerups = msg.powerups;
        }
      } else if (msg.type === 'state' && Array.isArray(msg.powerups)) {
        localPowerups = msg.powerups;
      } else if (msg.type === 'powerup_state') {
        if (msg.inventory) {
          playerPowerupInv = { ...playerPowerupInv, ...msg.inventory };
        }
        if (msg.effects && player && player.effects) {
          Object.assign(player.effects, msg.effects);
        }
        if (msg.picked && player) {
          playTone(620, 'sine', 0.08, 0.06);
          const spec = POWERUP_SPECS[msg.picked];
          floatingTexts.push({
            x: player.x,
            y: player.y - 18,
            text: `+1 ${spec ? spec.label : ''}`,
            alpha: 1.0,
            color: spec ? spec.color : '#ffd166'
          });
        }
      }
    } catch {
      // ignore non-json
    }
  });
}

function drawPowerupOrbs(viewW, viewH, now) {
  const pulse = 1 + 0.1 * Math.sin(now * 0.006);
  for (let i = 0; i < localPowerups.length; i++) {
    const pu = localPowerups[i];
    if (Math.abs(pu.x - player.x) > viewW || Math.abs(pu.y - player.y) > viewH) continue;
    const spec = POWERUP_SPECS[pu.type];
    if (!spec) continue;

    const orbR = 16 * pulse;
    gCtx.save();

    // Glowing aura
    const grad = gCtx.createRadialGradient(pu.x, pu.y, 2, pu.x, pu.y, orbR * 1.65);
    grad.addColorStop(0, spec.glow);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gCtx.fillStyle = grad;
    gCtx.beginPath();
    gCtx.arc(pu.x, pu.y, orbR * 1.65, 0, Math.PI * 2);
    gCtx.fill();

    // Orb circle
    gCtx.fillStyle = 'rgba(10, 22, 36, 0.88)';
    gCtx.strokeStyle = spec.color;
    gCtx.lineWidth = 2.4;
    gCtx.beginPath();
    gCtx.arc(pu.x, pu.y, orbR, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.stroke();

    // Crisp vector icon inside orb
    gCtx.translate(pu.x, pu.y);
    gCtx.strokeStyle = spec.color;
    gCtx.fillStyle = spec.color;
    gCtx.lineWidth = 2.2;
    gCtx.lineCap = 'round';
    gCtx.lineJoin = 'round';

    if (pu.type === 'magnet') {
      gCtx.beginPath();
      gCtx.arc(0, 1, 6.5, 0, Math.PI, false);
      gCtx.moveTo(-6.5, 1);
      gCtx.lineTo(-6.5, -6);
      gCtx.moveTo(6.5, 1);
      gCtx.lineTo(6.5, -6);
      gCtx.stroke();
    } else if (pu.type === 'zoom') {
      gCtx.beginPath();
      gCtx.moveTo(-7, 2);
      gCtx.lineTo(7, -4);
      gCtx.lineTo(7, 1);
      gCtx.lineTo(-7, 5);
      gCtx.closePath();
      gCtx.stroke();
      gCtx.beginPath();
      gCtx.moveTo(0, 3);
      gCtx.lineTo(-3, 8);
      gCtx.moveTo(0, 3);
      gCtx.lineTo(3, 8);
      gCtx.stroke();
    } else if (pu.type === 'freeBoost') {
      gCtx.beginPath();
      gCtx.moveTo(1.5, -8);
      gCtx.lineTo(-5.5, 1);
      gCtx.lineTo(0, 1);
      gCtx.lineTo(-1.5, 8);
      gCtx.lineTo(5.5, -1);
      gCtx.lineTo(0, -1);
      gCtx.closePath();
      gCtx.fill();
    }

    gCtx.restore();
  }
}

window.addEventListener('resize', () => {
  if (!inGame) return;
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  if (!arenaPattern) {
    arenaPattern = gCtx.createPattern(arenaTile, 'repeat');
  }
});

// Place body segments accurately along the recorded head path
function updateSegmentsFromPath(worm) {
  const targetLen = calcTargetSegments(worm.score);
  const r = calcWormRadius(worm.score);
  const segSpacing = Math.max(2.6, r * 0.22);
  if (!worm.path || worm.path.length === 0) {
    worm.path = [{ x: worm.x, y: worm.y }];
  }
  worm.path[0].x = worm.x;
  worm.path[0].y = worm.y;

  const newSegs = [{ x: worm.x, y: worm.y }];
  let pathIdx = 0;
  let segDistAcc = 0;

  for (let s = 1; s < targetLen; s++) {
    const targetDist = s * segSpacing;
    while (pathIdx < worm.path.length - 1) {
      const p1 = worm.path[pathIdx];
      const p2 = worm.path[pathIdx + 1];
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
      const tailOrigin = worm.path[worm.path.length - 1];
      newSegs.push({ x: tailOrigin.x, y: tailOrigin.y });
    }
  }

  if (worm.path.length > pathIdx + 3) {
    worm.path.length = pathIdx + 3;
  }
  worm.segments = newSegs;
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

  const rHead = calcWormRadius(worm.score);
  const hasFreeBoost = worm.effects.freeBoost > 0;
  const wantsBoost = worm.isPlayer ? isBoosting : false;
  const canBoost = hasFreeBoost || (wantsBoost && worm.score > 1);
  worm.isBoostingActive = canBoost;
  const speed = canBoost ? 280 : 160;

  let turnDiff = 0;
  if (worm.isPlayer) {
    turnDiff = pointerAngle - worm.angle;
    while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;

    // Exact proportional arc radius so 180-deg turns touch cleanly without gaps
    const turnRadius = rHead * 0.98;
    const maxStep = (speed / turnRadius) * dt;
    if (Math.abs(turnDiff) <= maxStep) {
      worm.angle = pointerAngle;
    } else {
      worm.angle += Math.sign(turnDiff) * maxStep;
    }
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
    turnDiff = worm.aiTargetAngle - worm.angle;
    while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
    const turnRadius = rHead * 1.65;
    const maxStep = (speed / turnRadius) * dt;
    if (Math.abs(turnDiff) <= maxStep) {
      worm.angle = worm.aiTargetAngle;
    } else {
      worm.angle += Math.sign(turnDiff) * maxStep;
    }
  }

  if (!mpConnected && canBoost && !hasFreeBoost) {
    const drain = dt * 1;
    worm.score = Math.max(0, worm.score - drain);
    if (worm.isPlayer) {
      worm.boostDrainAcc = (worm.boostDrainAcc || 0) + drain;
      if (worm.boostDrainAcc >= 1) {
        worm.boostDrainAcc -= 1;
        floatingTexts.push({
          x: worm.x,
          y: worm.y - 16,
          text: '-1',
          alpha: 1.0,
          color: '#ff6b6b'
        });
      }
    }
  } else if (!canBoost || hasFreeBoost) {
    worm.boostDrainAcc = 0;
  }

  worm.x += Math.cos(worm.angle) * speed * dt;
  worm.y += Math.sin(worm.angle) * speed * dt;

  if (mpConnected && worm.isPlayer && mpServerPos && !mpAwaitingJoinAck) {
    const errX = mpServerPos.x - worm.x;
    const errY = mpServerPos.y - worm.y;
    const errDist = Math.hypot(errX, errY);

    if (errDist > 260) {
      worm.x = mpServerPos.x;
      worm.y = mpServerPos.y;
      worm.path = [{ x: worm.x, y: worm.y }];
    } else if (errDist > 20 && Math.abs(turnDiff) < 0.14) {
      const blend = Math.min(0.18, dt * 2.5);
      worm.x += errX * blend;
      worm.y += errY * blend;
    }
  }

  // Ensure initial path is uncurled backwards along -angle so tail never bunches at spawn
  if (!worm.path || worm.path.length <= 1) {
    const initLen = calcTargetSegments(worm.score);
    const segSpacing = Math.max(2.6, rHead * 0.22);
    worm.path = [];
    for (let i = 0; i < initLen; i++) {
      worm.path.push({
        x: worm.x - Math.cos(worm.angle) * i * segSpacing,
        y: worm.y - Math.sin(worm.angle) * i * segSpacing
      });
    }
  } else if (Math.hypot(worm.x - worm.path[0].x, worm.y - worm.path[0].y) >= 0.8) {
    worm.path.unshift({ x: worm.x, y: worm.y });
  } else {
    worm.path[0].x = worm.x;
    worm.path[0].y = worm.y;
  }

  const maxCoord = ARENA_HALF - rHead;

  if (Math.abs(worm.x) >= maxCoord || Math.abs(worm.y) >= maxCoord) {
    worm.x = Math.max(-maxCoord, Math.min(maxCoord, worm.x));
    worm.y = Math.max(-maxCoord, Math.min(maxCoord, worm.y));
    worm.path[0].x = worm.x;
    worm.path[0].y = worm.y;
    if (!mpConnected || !worm.isPlayer) {
      killWorm(worm, bots, null);
      return;
    }
  }

  updateSegmentsFromPath(worm);

  if (worm.spawnHole) {
    const tail = worm.segments[worm.segments.length - 1];
    const tailDistFromHole = Math.hypot(tail.x - worm.spawnHole.x, tail.y - worm.spawnHole.y);
    if (tailDistFromHole > 8) {
      worm.spawnHole.alpha = Math.max(0, worm.spawnHole.alpha - dt * 2.5);
      if (worm.spawnHole.alpha <= 0) {
        worm.spawnHole = null;
      }
    }
  }

  if (!mpConnected) {
    // Offline powerup orb pickup
    const puEatRadius = rHead + 18;
    for (let i = localPowerups.length - 1; i >= 0; i--) {
      const pu = localPowerups[i];
      if (Math.hypot(worm.x - pu.x, worm.y - pu.y) < puEatRadius) {
        if (worm.isPlayer) {
          playerPowerupInv[pu.type] = (playerPowerupInv[pu.type] || 0) + 1;
          playTone(620, 'sine', 0.08, 0.06);
          const spec = POWERUP_SPECS[pu.type];
          floatingTexts.push({
            x: pu.x,
            y: pu.y - 12,
            text: `+1 ${spec ? spec.label : ''}`,
            alpha: 1.0,
            color: spec ? spec.color : '#ffd166'
          });
        }
        localPowerups.splice(i, 1);
      }
    }

    const eatRadius = rHead + (worm.effects.magnet > 0 ? 130 : 14);
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      const dist = Math.hypot(worm.x - f.x, worm.y - f.y);
      if (worm.effects.magnet > 0 && dist < 185) {
        f.x += (worm.x - f.x) * 0.16;
        f.y += (worm.y - f.y) * 0.16;
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

      for (let s = 4; s < w2.segments.length; s += 2) {
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

// Helper: trace a smooth quadratic spline through a range of segments
function traceSmoothSpline(ctx, segs, startIdx, endIdx) {
  if (endIdx < startIdx) return;
  ctx.beginPath();
  ctx.moveTo(segs[startIdx].x, segs[startIdx].y);
  if (endIdx === startIdx) {
    ctx.lineTo(segs[endIdx].x, segs[endIdx].y);
    return;
  }
  const step = (endIdx - startIdx) > 30 ? 3 : 1;
  for (let i = startIdx; i < endIdx; i += step) {
    const curr = segs[i];
    const next = segs[Math.min(endIdx, i + step)];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.lineTo(segs[endIdx].x, segs[endIdx].y);
}

function renderContinuousWormBody(ctx, segs, r, colors, isBoostingActive = false) {
  const len = segs.length;
  if (len === 0) return;

  ctx.save();
  ctx.lineJoin = 'round';

  // 1. Boost outer golden aura
  if (isBoostingActive) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.28)';
    ctx.lineWidth = (r + 4.5) * 2;
    traceSmoothSpline(ctx, segs, 0, len - 1);
    ctx.stroke();
  }

  // 2. Dark outline + base fill
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(8, 16, 24, 0.45)';
  ctx.lineWidth = r * 2 + 2.4;
  traceSmoothSpline(ctx, segs, 0, len - 1);
  ctx.stroke();

  ctx.strokeStyle = colors[0];
  ctx.lineWidth = r * 2;
  traceSmoothSpline(ctx, segs, 0, len - 1);
  ctx.stroke();

  // 3. Alternating color bands (wider step = 3x higher FPS)
  const bandStep = 6;
  ctx.lineCap = 'butt';
  for (let end = len - 1; end > 0; end -= bandStep) {
    const start = Math.max(0, end - bandStep);
    const bandIdx = Math.floor(start / bandStep);
    ctx.strokeStyle = colors[bandIdx % colors.length];
    ctx.lineWidth = r * 2;
    traceSmoothSpline(ctx, segs, start, end);
    ctx.stroke();
  }

  // 4. Tail cap
  if (len >= 2) {
    const tail = segs[len - 1];
    const prevTail = segs[len - 2];
    const tailAngle = Math.atan2(tail.y - prevTail.y, tail.x - prevTail.x);
    const lastBandStart = Math.floor((len - 2) / bandStep) * bandStep;
    const tailColor = colors[Math.floor(lastBandStart / bandStep) % colors.length];

    ctx.fillStyle = tailColor;
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, r, tailAngle - Math.PI * 0.5, tailAngle + Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawWorm(worm) {
  const r = calcWormRadius(worm.score);
  const len = worm.segments.length;
  if (len === 0) return;

  if (worm.spawnHole && worm.spawnHole.alpha > 0) {
    gCtx.save();
    gCtx.globalAlpha = worm.spawnHole.alpha;
    gCtx.fillStyle = 'rgba(6, 18, 13, 0.45)';
    gCtx.beginPath();
    gCtx.arc(worm.spawnHole.x, worm.spawnHole.y, r + 9, 0, Math.PI * 2);
    gCtx.fill();

    gCtx.fillStyle = '#07140f';
    gCtx.beginPath();
    gCtx.arc(worm.spawnHole.x, worm.spawnHole.y, r + 3, 0, Math.PI * 2);
    gCtx.fill();

    gCtx.strokeStyle = 'rgba(118, 200, 147, 0.25)';
    gCtx.lineWidth = 2;
    gCtx.stroke();
    gCtx.restore();
  }

  if (worm.shieldTime > 0) {
    const blink = worm.shieldTime < 1.5 && Math.floor(worm.shieldTime * 10) % 2 === 0;
    gCtx.strokeStyle = blink ? '#facc15' : 'rgba(76, 201, 240, 0.75)';
    gCtx.lineWidth = 4;
    gCtx.beginPath();
    gCtx.arc(worm.x, worm.y, r + 10, 0, Math.PI * 2);
    gCtx.stroke();
  }

  renderContinuousWormBody(gCtx, worm.segments, r, worm.colors, worm.isBoostingActive);

  // 3D shaded head cap matching the tube seamlessly
  const headGrad = gCtx.createRadialGradient(
    worm.x - r * 0.28, worm.y - r * 0.28, r * 0.12,
    worm.x, worm.y, r
  );
  headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
  headGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
  headGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');

  gCtx.fillStyle = worm.colors[0];
  gCtx.beginPath();
  gCtx.arc(worm.x, worm.y, r, 0, Math.PI * 2);
  gCtx.fill();

  gCtx.fillStyle = headGrad;
  gCtx.beginPath();
  gCtx.arc(worm.x, worm.y, r, 0, Math.PI * 2);
  gCtx.fill();

  // Mouth
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

  // Expressive eyes
  const eyeDist = r * 0.42;
  [-0.58, 0.58].forEach(offset => {
    const ex = worm.x + Math.cos(worm.angle + offset) * eyeDist;
    const ey = worm.y + Math.sin(worm.angle + offset) * eyeDist;
    gCtx.fillStyle = '#fff';
    gCtx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.arc(ex, ey, r * 0.29, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.stroke();

    const px = ex + Math.cos(worm.angle) * (r * 0.11);
    const py = ey + Math.sin(worm.angle) * (r * 0.11);
    gCtx.fillStyle = '#111';
    gCtx.beginPath();
    gCtx.arc(px, py, r * 0.15, 0, Math.PI * 2);
    gCtx.fill();

    gCtx.fillStyle = '#fff';
    gCtx.beginPath();
    gCtx.arc(px - r * 0.04, py - r * 0.04, r * 0.05, 0, Math.PI * 2);
    gCtx.fill();
  });

  gCtx.fillStyle = '#fff';
  gCtx.font = 'bold 13px Segoe UI';
  gCtx.textAlign = 'center';
  gCtx.fillText(worm.name, worm.x, worm.y - r - 10);
}

function drawMinimap() {
  const x0 = 14;
  const y0 = 56;
  const size = 68;
  const cx = x0 + size / 2;
  const cy = y0 + size / 2;

  gCtx.save();
  gCtx.fillStyle = 'rgba(10, 20, 35, 0.52)';
  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  gCtx.lineWidth = 1.2;
  gCtx.beginPath();
  gCtx.roundRect(x0, y0, size, size, 8);
  gCtx.fill();
  gCtx.stroke();

  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  gCtx.lineWidth = 1;
  gCtx.beginPath();
  gCtx.moveTo(cx, y0 + 5);
  gCtx.lineTo(cx, y0 + size - 5);
  gCtx.moveTo(x0 + 5, cy);
  gCtx.lineTo(x0 + size - 5, cy);
  gCtx.stroke();

  const scale = (size / 2 - 5) / ARENA_HALF;
  const others = mpConnected ? remoteWorms : bots;
  others.forEach(b => {
    gCtx.fillStyle = 'rgba(255, 107, 107, 0.85)';
    gCtx.beginPath();
    gCtx.arc(cx + b.x * scale, cy + b.y * scale, 2, 0, Math.PI * 2);
    gCtx.fill();
  });

  if (player) {
    gCtx.fillStyle = 'rgba(128, 237, 153, 0.95)';
    gCtx.beginPath();
    gCtx.arc(cx + player.x * scale, cy + player.y * scale, 3, 0, Math.PI * 2);
    gCtx.fill();
  }
  gCtx.restore();
}

function drawFloatingJoystick() {
  if (!joyActive) return;

  gCtx.save();

  gCtx.fillStyle = 'rgba(12, 24, 38, 0.28)';
  gCtx.strokeStyle = isBoosting ? 'rgba(250, 204, 21, 0.55)' : 'rgba(255, 255, 255, 0.34)';
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.arc(joyOriginX, joyOriginY, JOY_MAX_RADIUS, 0, Math.PI * 2);
  gCtx.fill();
  gCtx.stroke();

  gCtx.strokeStyle = isBoosting ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.22)';
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.moveTo(joyOriginX, joyOriginY);
  gCtx.lineTo(joyKnobX, joyKnobY);
  gCtx.stroke();

  gCtx.fillStyle = isBoosting ? 'rgba(250, 204, 21, 0.78)' : 'rgba(255, 255, 255, 0.65)';
  gCtx.beginPath();
  gCtx.arc(joyKnobX, joyKnobY, 17, 0, Math.PI * 2);
  gCtx.fill();

  gCtx.restore();
}

let trackedRunPlayer = null;

function gameLoop(now) {
  if (!inGame || !player) {
    updatePowerupHudBar();
    return;
  }

  if (player !== trackedRunPlayer) {
    trackedRunPlayer = player;
    if (!mpConnected) {
      playerPowerupInv = { magnet: 0, zoom: 0, freeBoost: 0 };
      localPowerups = [];
    }
  }

  syncMultiplayerPowerupHook();
  if (!mpConnected) {
    ensureLocalPowerups();
  }

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

      if (!rw.path || rw.path.length === 0) {
        rw.path = [{ x: rw.x, y: rw.y }];
      }
      if (Math.hypot(rw.x - rw.path[0].x, rw.y - rw.path[0].y) >= 0.8) {
        rw.path.unshift({ x: rw.x, y: rw.y });
      } else {
        rw.path[0].x = rw.x;
        rw.path[0].y = rw.y;
      }
      updateSegmentsFromPath(rw);
    });
  }

  updateWorm(player, dt);
  if (!inGame) {
    updatePowerupHudBar();
    return;
  }

  if (!mpConnected) {
    bots.forEach(b => updateWorm(b, dt));
    checkWormCollisions();
    if (!inGame) {
      updatePowerupHudBar();
      return;
    }
  }

  const baseZoom = Math.max(0.72, 1.24 - Math.pow(Math.max(0, player.score), 0.34) * 0.014);
  const targetZoom = player.effects.zoom > 0 ? baseZoom * 0.68 : baseZoom;
  currentZoom += (targetZoom - currentZoom) * Math.min(1, dt * 2.4);

  gCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gCtx.save();
  gCtx.translate(gameCanvas.width / 2, gameCanvas.height / 2);
  gCtx.scale(currentZoom, currentZoom);
  gCtx.translate(-player.x, -player.y);

  gCtx.fillStyle = '#091510';
  gCtx.fillRect(-ARENA_HALF - 1500, -ARENA_HALF - 1500, (ARENA_HALF + 1500) * 2, (ARENA_HALF + 1500) * 2);

  gCtx.fillStyle = arenaPattern || '#14362b';
  gCtx.fillRect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2);

  gCtx.strokeStyle = '#ef4444';
  gCtx.lineWidth = 16;
  gCtx.strokeRect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2);

  const viewW = (gameCanvas.width / currentZoom) * 0.65;
  const viewH = (gameCanvas.height / currentZoom) * 0.65;

  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    if (Math.abs(f.x - player.x) > viewW || Math.abs(f.y - player.y) > viewH) continue;
    const sprite = fruitSprites[f.t] || fruitSprites[0];
    gCtx.drawImage(sprite, f.x - sprite.width / 2, f.y - sprite.height / 2);
  }

  drawPowerupOrbs(viewW, viewH, now);

  if (mpConnected) {
    remoteWorms.forEach(drawWorm);
  } else {
    bots.forEach(drawWorm);
  }
  drawWorm(player);

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
  drawFloatingJoystick();
  updatePowerupHudBar();
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