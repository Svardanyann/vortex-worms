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

window.addEventListener('resize', () => {
  if (!inGame) return;
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  if (!arenaPattern) {
    arenaPattern = gCtx.createPattern(arenaTile, 'repeat');
  }
});

// Place body segments along the exact ground path of the head (zero sideways drift)
function updateSegmentsFromPath(worm) {
  const targetLen = calcTargetSegments(worm.score);
  const segSpacing = 5.2;
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
  const wantsBoost = worm.isPlayer ? isBoosting : false;
  const canBoost = wantsBoost && (worm.score > 1 || worm.effects.freeBoost > 0);
  worm.isBoostingActive = canBoost;
  const speed = canBoost ? 280 : 160;

  let turnDiff = 0;
  if (worm.isPlayer) {
    turnDiff = pointerAngle - worm.angle;
    while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;

    const sizeFactor = Math.max(0.75, 10.5 / rHead);
    const maxTurnRate = 9.0 * sizeFactor;
    const step = turnDiff * Math.min(1, dt * 22);
    worm.angle += Math.max(-maxTurnRate * dt, Math.min(maxTurnRate * dt, step));
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
    const maxTurnRate = 5.5;
    const step = turnDiff * Math.min(1, dt * 12);
    worm.angle += Math.max(-maxTurnRate * dt, Math.min(maxTurnRate * dt, step));
  }

  if (!mpConnected && canBoost && worm.effects.freeBoost <= 0) {
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
  } else if (!canBoost) {
    worm.boostDrainAcc = 0;
  }

  worm.x += Math.cos(worm.angle) * speed * dt;
  worm.y += Math.sin(worm.angle) * speed * dt;

  // Reconcile only when moving straight or on large lag spikes; never shift recorded path sideways
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

  if (!worm.path || worm.path.length === 0) {
    worm.path = [{ x: worm.x, y: worm.y }];
  }
  if (Math.hypot(worm.x - worm.path[0].x, worm.y - worm.path[0].y) >= 1.2) {
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

  // Fade out ground burrow hole once tail exits it
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

  // Distinct golden energy aura when boosting
  if (worm.isBoostingActive) {
    const pulse = 0.85 + 0.15 * Math.sin(performance.now() * 0.02);
    gCtx.save();
    gCtx.fillStyle = 'rgba(250, 204, 21, 0.18)';
    for (let i = len - 1; i >= 0; i -= 2) {
      const seg = worm.segments[i];
      gCtx.beginPath();
      gCtx.arc(seg.x, seg.y, r + 6 * pulse, 0, Math.PI * 2);
      gCtx.fill();
    }
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

  for (let i = len - 1; i >= 1; i--) {
    const seg = worm.segments[i];
    gCtx.fillStyle = worm.colors[i % worm.colors.length];
    gCtx.beginPath();
    gCtx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
    gCtx.fill();
    if (worm.isBoostingActive) {
      gCtx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
      gCtx.lineWidth = 2;
      gCtx.stroke();
    }
  }

  gCtx.fillStyle = worm.colors[0];
  gCtx.beginPath();
  gCtx.arc(worm.x, worm.y, r, 0, Math.PI * 2);
  gCtx.fill();
  if (worm.isBoostingActive) {
    gCtx.strokeStyle = '#fef08a';
    gCtx.lineWidth = 2.5;
    gCtx.stroke();
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
  let x0 = 12;
  let y0 = 52;
  const size = 64;

  const coinsEl = document.getElementById('gameCoinsVal');
  const coinsPill = coinsEl ? coinsEl.parentElement : null;
  if (coinsPill) {
    const rect = coinsPill.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x0 = Math.round(rect.left);
      y0 = Math.round(rect.bottom + 6);
    }
  }

  const cx = x0 + size / 2;
  const cy = y0 + size / 2;

  gCtx.save();
  gCtx.fillStyle = 'rgba(10, 20, 35, 0.18)';
  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  gCtx.lineWidth = 1;
  gCtx.beginPath();
  gCtx.roundRect(x0, y0, size, size, 8);
  gCtx.fill();
  gCtx.stroke();

  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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
    gCtx.fillStyle = 'rgba(255, 107, 107, 0.75)';
    gCtx.beginPath();
    gCtx.arc(cx + b.x * scale, cy + b.y * scale, 1.8, 0, Math.PI * 2);
    gCtx.fill();
  });

  if (player) {
    gCtx.fillStyle = 'rgba(128, 237, 153, 0.9)';
    gCtx.beginPath();
    gCtx.arc(cx + player.x * scale, cy + player.y * scale, 2.8, 0, Math.PI * 2);
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

      // Build remote body segments smoothly from head path (eliminates jitter)
      if (!rw.path || rw.path.length === 0) {
        rw.path = [{ x: rw.x, y: rw.y }];
      }
      if (Math.hypot(rw.x - rw.path[0].x, rw.y - rw.path[0].y) >= 1.2) {
        rw.path.unshift({ x: rw.x, y: rw.y });
      } else {
        rw.path[0].x = rw.x;
        rw.path[0].y = rw.y;
      }
      updateSegmentsFromPath(rw);
    });
  }

  updateWorm(player, dt);
  if (!inGame) return;

  if (!mpConnected) {
    bots.forEach(b => updateWorm(b, dt));
    checkWormCollisions();
    if (!inGame) return;
  }

  const baseZoom = Math.max(0.72, 1.24 - Math.pow(Math.max(0, player.score), 0.34) * 0.014);
  const targetZoom = player.effects.zoom > 0 ? baseZoom * 0.72 : baseZoom;
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