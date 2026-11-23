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

  // Predictive dead-reckoning reconciliation
  if (mpConnected && worm.isPlayer && mpServerPos) {
    const elapsed = Math.min(0.12, Math.max(0, (performance.now() - mpServerPos.at) / 1000));
    const srvSpeed = (mpServerPos.boosting && worm.score > 15) ? 340 : 195;
    const predX = mpServerPos.x + Math.cos(mpServerPos.angle) * srvSpeed * elapsed;
    const predY = mpServerPos.y + Math.sin(mpServerPos.angle) * srvSpeed * elapsed;

    const errX = predX - worm.x;
    const errY = predY - worm.y;
    const errDist = Math.hypot(errX, errY);
    if (errDist > 180) {
      worm.x = predX;
      worm.y = predY;
    } else {
      const blend = Math.min(1, dt * 8);
      worm.x += errX * blend;
      worm.y += errY * blend;
    }
  }

  const rHead = calcWormRadius(worm.score);
  const maxCoord = ARENA_HALF - rHead;

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