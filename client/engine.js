// ==========================================
// VORTEX WORMS: GAME ENGINE, SPRITES & AUDIO
// ==========================================

const COIN_SVG_HTML = `<svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="coinOuterGold" cx="35%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="32%" stop-color="#fde047"/>
      <stop offset="72%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </radialGradient>
    <radialGradient id="coinInnerWell" cx="65%" cy="70%" r="75%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="60%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </radialGradient>
    <linearGradient id="coinEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- 3D bottom thickness rim -->
  <circle cx="20" cy="22.2" r="16.5" fill="#78350f"/>
  <circle cx="20" cy="21" r="16.5" fill="#b45309"/>
  <!-- Main coin face -->
  <circle cx="20" cy="19" r="16.5" fill="url(#coinOuterGold)" stroke="#fef9c3" stroke-width="1.3"/>
  <!-- Recessed inner medallion -->
  <circle cx="20" cy="19" r="12.2" fill="url(#coinInnerWell)" stroke="#fef08a" stroke-width="0.9"/>
  <!-- Embossed royal crown / diamond emblem -->
  <path d="M13.2 22.8 L14.4 15.2 L17.6 18.2 L20 13.4 L22.4 18.2 L25.6 15.2 L26.8 22.8 Z" fill="url(#coinEmblemGrad)" stroke="#78350f" stroke-width="1" stroke-linejoin="round"/>
  <rect x="13.2" y="23.6" width="13.6" height="2" rx="1" fill="#fef9c3" stroke="#78350f" stroke-width="0.7"/>
  <!-- Glossy top-left specular shine -->
  <ellipse cx="14.5" cy="11.2" rx="5.2" ry="2.3" transform="rotate(-32 14.5 11.2)" fill="rgba(255,255,255,0.65)"/>
</svg>`;

const lobbyCoinWrap = document.getElementById('lobbyCoinSvgWrap');
const gameCoinWrap = document.getElementById('gameCoinSvgWrap');
if (lobbyCoinWrap) lobbyCoinWrap.innerHTML = COIN_SVG_HTML;
if (gameCoinWrap) gameCoinWrap.innerHTML = COIN_SVG_HTML;

// ==========================================
// GLOSSY VECTOR POWERUP SVGs (HUD & SHOP)
// ==========================================
const POWERUP_SVGS = {
  magnet: `<svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="magRed" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff6b6b"/>
        <stop offset="55%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#991b1b"/>
      </linearGradient>
      <linearGradient id="magSilver" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#cbd5e1"/>
        <stop offset="100%" stop-color="#64748b"/>
      </linearGradient>
    </defs>
    <path d="M10 12 V22 A10 10 0 0 0 30 22 V12 H24 V22 A4 4 0 0 1 16 22 V12 Z" fill="url(#magRed)" stroke="#7f1d1d" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="10" y="9" width="6" height="5.5" rx="1.2" fill="url(#magSilver)" stroke="#475569" stroke-width="1.1"/>
    <rect x="24" y="9" width="6" height="5.5" rx="1.2" fill="url(#magSilver)" stroke="#475569" stroke-width="1.1"/>
    <path d="M12.5 16 V22 A7.5 7.5 0 0 0 21 29.4" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`,
  zoom: `<svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scopeBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7dd3fc"/>
        <stop offset="50%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0c4a6e"/>
      </linearGradient>
      <radialGradient id="lensGlow" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="45%" stop-color="#bae6fd"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </radialGradient>
    </defs>
    <g transform="rotate(-28 20 20)">
      <rect x="6" y="16.5" width="9" height="7" rx="2" fill="#eab308" stroke="#854d0e" stroke-width="1.2"/>
      <rect x="14" y="15" width="11" height="10" rx="2.5" fill="url(#scopeBlue)" stroke="#082f49" stroke-width="1.3"/>
      <rect x="24" y="13.5" width="9" height="13" rx="3" fill="url(#scopeBlue)" stroke="#082f49" stroke-width="1.3"/>
      <ellipse cx="33" cy="20" rx="2.4" ry="5.5" fill="url(#lensGlow)" stroke="#e0f2fe" stroke-width="1"/>
      <line x1="15" y1="17.2" x2="31" y2="16.2" stroke="rgba(255,255,255,0.65)" stroke-width="1.6" stroke-linecap="round"/>
    </g>
  </svg>`,
  freeBoost: `<svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boltGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef9c3"/>
        <stop offset="45%" stop-color="#facc15"/>
        <stop offset="100%" stop-color="#ea580c"/>
      </linearGradient>
    </defs>
    <path d="M22.5 6 L10.5 21.5 H19.5 L17.5 34 L29.5 18.5 H20.5 Z" fill="url(#boltGold)" stroke="#9a3412" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M21 9.5 L13.5 19.5 H19" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`
};

// ==========================================
// GLOSSY NATURAL FRUIT SPRITE GENERATOR
// ==========================================
const FRUIT_SPECS = [
  { kind: 'cherry', val: 2, r: 10 },
  { kind: 'melon', val: 3, r: 11 },
  { kind: 'grape', val: 4, r: 11 },
  { kind: 'mushroom', val: 4, r: 10 },
  { kind: 'strawberry', val: 5, r: 11 },
  { kind: 'peanut', val: 6, r: 11 },
  { kind: 'chili', val: 7, r: 11 },
  { kind: 'carrot', val: 8, r: 12 },
  { kind: 'appleRed', val: 9, r: 12 },
  { kind: 'appleGreen', val: 10, r: 12 },
  { kind: 'pear', val: 11, r: 12 },
  { kind: 'peach', val: 12, r: 13 },
  { kind: 'banana', val: 13, r: 13 },
  { kind: 'orange', val: 14, r: 13 },
  { kind: 'lemon', val: 15, r: 13 },
  { kind: 'tomato', val: 16, r: 13 },
  { kind: 'cucumber', val: 17, r: 13 },
  { kind: 'corn', val: 18, r: 14 },
  { kind: 'eggplant', val: 20, r: 14 },
  { kind: 'broccoli', val: 22, r: 14 },
  { kind: 'avocado', val: 24, r: 14 },
  { kind: 'mango', val: 25, r: 15 },
  { kind: 'kiwi', val: 26, r: 14 },
  { kind: 'coconut', val: 28, r: 15 },
  { kind: 'pineapple', val: 29, r: 15 },
  { kind: 'watermelon', val: 30, r: 16 }
];

function drawGlossSphere(ctx, x, y, rad, cLight, cMid, cDark, strokeCol) {
  const g = ctx.createRadialGradient(x - rad * 0.34, y - rad * 0.34, rad * 0.08, x, y, rad);
  g.addColorStop(0, cLight);
  g.addColorStop(0.55, cMid);
  g.addColorStop(1, cDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  ctx.beginPath();
  ctx.ellipse(x - rad * 0.34, y - rad * 0.36, rad * 0.28, rad * 0.16, -0.55, 0, Math.PI * 2);
  ctx.fill();
}

function drawLeaf(ctx, x, y, ang, len, wid) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const lg = ctx.createLinearGradient(0, -wid, len, wid);
  lg.addColorStop(0, '#86efac');
  lg.addColorStop(0.5, '#22c55e');
  lg.addColorStop(1, '#15803d');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
  ctx.fill();
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

function renderFruitArt(ctx, kind) {
  ctx.save();
  switch (kind) {
    case 'cherry': {
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, 6);
      ctx.quadraticCurveTo(-4, -9, 4, -14);
      ctx.moveTo(8, 8);
      ctx.quadraticCurveTo(7, -6, 4, -14);
      ctx.stroke();
      drawLeaf(ctx, 4, -14, -0.25, 13, 5.5);
      drawGlossSphere(ctx, -7, 8, 8.2, '#fda4af', '#e11d48', '#881337', '#4c0519');
      drawGlossSphere(ctx, 8, 10, 8.2, '#fda4af', '#dc2626', '#7f1d1d', '#450a0a');
      break;
    }
    case 'melon': {
      drawGlossSphere(ctx, 0, 1, 15.5, '#fef9c3', '#fde047', '#ca8a04', '#854d0e');
      ctx.strokeStyle = 'rgba(161,98,7,0.38)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(0, 1, 6.5, 14.5, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 1, 11.5, 14.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'grape': {
      drawLeaf(ctx, 0, -14, -0.35, 13, 5.5);
      const pts = [[-6, -5], [6, -5], [0, -2], [-8, 3], [0, 4], [8, 3], [-4, 10], [4, 10], [0, 15]];
      for (const [gx, gy] of pts) {
        drawGlossSphere(ctx, gx, gy, 5.6, '#e9d5ff', '#9333ea', '#4c1d95', '#3b0764');
      }
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-5.5, 1, 11, 14, 4.5);
      ctx.fill();
      ctx.stroke();
      const cg = ctx.createRadialGradient(-5, -8, 2, 0, -3, 17);
      cg.addColorStop(0, '#fca5a5');
      cg.addColorStop(0.55, '#ef4444');
      cg.addColorStop(1, '#991b1b');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 1, 15.5, Math.PI, 0);
      ctx.quadraticCurveTo(16, 5, 0, 5);
      ctx.quadraticCurveTo(-16, 5, -15.5, 1);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.stroke();
      ctx.fillStyle = '#fffbeb';
      for (const [sx, sy, sr] of [[-7, -5, 2.6], [1, -9, 3.1], [8, -4, 2.4], [-2, -2, 2.1]]) {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'strawberry': {
      const sg = ctx.createRadialGradient(-5, -6, 2, 0, 2, 17);
      sg.addColorStop(0, '#fda4af');
      sg.addColorStop(0.5, '#f43f5e');
      sg.addColorStop(1, '#9f1239');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(0, 16.5);
      ctx.bezierCurveTo(14, 9, 15, -8, 0, -9);
      ctx.bezierCurveTo(-15, -8, -14, 9, 0, 16.5);
      ctx.fill();
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      for (const [dx, dy] of [[-5, -2], [0, -3], [5, -2], [-6, 4], [0, 4], [6, 4], [-3, 10], [3, 10]]) {
        ctx.beginPath();
        ctx.ellipse(dx, dy, 1.1, 1.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLeaf(ctx, 0, -9, -2.6, 11, 4.5);
      drawLeaf(ctx, 0, -9, -0.5, 11, 4.5);
      drawLeaf(ctx, 0, -9, -1.57, 9, 4);
      break;
    }
    case 'peanut': {
      ctx.rotate(-0.55);
      const pg = ctx.createLinearGradient(0, -10, 0, 10);
      pg.addColorStop(0, '#fde68a');
      pg.addColorStop(0.55, '#d97706');
      pg.addColorStop(1, '#78350f');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(-15, -9, -4, -9, 0, -5);
      ctx.bezierCurveTo(4, -9, 15, -9, 15, 0);
      ctx.bezierCurveTo(15, 9, 4, 9, 0, 5);
      ctx.bezierCurveTo(-4, 9, -15, 9, -15, 0);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'chili': {
      ctx.rotate(-0.4);
      const cg = ctx.createLinearGradient(-14, -6, 14, 10);
      cg.addColorStop(0, '#fca5a5');
      cg.addColorStop(0.45, '#ef4444');
      cg.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(-11, -6);
      ctx.quadraticCurveTo(4, -9, 14, 12);
      ctx.quadraticCurveTo(0, 7, -13, 2);
      ctx.quadraticCurveTo(-16, -3, -11, -6);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-12, -3);
      ctx.quadraticCurveTo(-16, -9, -12, -13);
      ctx.stroke();
      break;
    }
    case 'carrot': {
      ctx.rotate(0.55);
      drawLeaf(ctx, 0, -13, -2.1, 11, 4);
      drawLeaf(ctx, 0, -13, -1.57, 12, 4);
      drawLeaf(ctx, 0, -13, -1.0, 11, 4);
      const cg = ctx.createLinearGradient(-9, -12, 9, 16);
      cg.addColorStop(0, '#fdba74');
      cg.addColorStop(0.5, '#f97316');
      cg.addColorStop(1, '#9a3412');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(-8, -11);
      ctx.quadraticCurveTo(0, -14, 8, -11);
      ctx.lineTo(1, 17);
      ctx.quadraticCurveTo(0, 19, -1, 17);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      break;
    }
    case 'appleRed':
    case 'appleGreen': {
      const isGreen = kind === 'appleGreen';
      drawGlossSphere(
        ctx, 0, 2, 15,
        isGreen ? '#dcfce7' : '#fecaca',
        isGreen ? '#22c55e' : '#ef4444',
        isGreen ? '#15803d' : '#991b1b',
        isGreen ? '#14532d' : '#7f1d1d'
      );
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(1, -16, 4, -18);
      ctx.stroke();
      drawLeaf(ctx, 1, -14, -0.35, 11, 4.5);
      break;
    }
    case 'pear': {
      const pg = ctx.createRadialGradient(-4, -4, 2, 0, 3, 17);
      pg.addColorStop(0, '#fef9c3');
      pg.addColorStop(0.55, '#a3e635');
      pg.addColorStop(1, '#4d7c0f');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.bezierCurveTo(7, -13, 7, -4, 12, 3);
      ctx.bezierCurveTo(16, 11, 9, 17, 0, 17);
      ctx.bezierCurveTo(-9, 17, -16, 11, -12, 3);
      ctx.bezierCurveTo(-7, -4, -7, -13, 0, -13);
      ctx.fill();
      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(2, -18);
      ctx.stroke();
      break;
    }
    case 'peach': {
      drawGlossSphere(ctx, 0, 2, 15, '#ffedd5', '#fb923c', '#e11d48', '#9f1239');
      ctx.strokeStyle = 'rgba(159,18,57,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(5, 2, 0, 16);
      ctx.stroke();
      drawLeaf(ctx, 0, -12, -0.3, 12, 5);
      break;
    }
    case 'banana': {
      const bg = ctx.createLinearGradient(-12, -12, 12, 12);
      bg.addColorStop(0, '#fef9c3');
      bg.addColorStop(0.5, '#facc15');
      bg.addColorStop(1, '#ca8a04');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-12, -13);
      ctx.quadraticCurveTo(16, -6, 13, 14);
      ctx.quadraticCurveTo(2, 4, -14, -9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'orange': {
      drawGlossSphere(ctx, 0, 1, 15, '#ffedd5', '#f97316', '#c2410c', '#7c2d12');
      drawLeaf(ctx, 0, -13, -0.25, 11, 4.5);
      break;
    }
    case 'lemon': {
      ctx.rotate(-0.45);
      const lg = ctx.createRadialGradient(-4, -4, 2, 0, 0, 17);
      lg.addColorStop(0, '#fefce8');
      lg.addColorStop(0.55, '#fde047');
      lg.addColorStop(1, '#ca8a04');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.quadraticCurveTo(-13, -12, 0, -12);
      ctx.quadraticCurveTo(13, -12, 17, 0);
      ctx.quadraticCurveTo(13, 12, 0, 12);
      ctx.quadraticCurveTo(-13, 12, -17, 0);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'tomato': {
      drawGlossSphere(ctx, 0, 2, 15, '#fecaca', '#ef4444', '#b91c1c', '#7f1d1d');
      drawLeaf(ctx, 0, -11, -2.7, 10, 3.8);
      drawLeaf(ctx, 0, -11, -0.4, 10, 3.8);
      drawLeaf(ctx, 0, -11, -1.57, 8, 3.5);
      break;
    }
    case 'cucumber': {
      ctx.rotate(-0.55);
      const cg = ctx.createLinearGradient(0, -8, 0, 8);
      cg.addColorStop(0, '#86efac');
      cg.addColorStop(0.5, '#16a34a');
      cg.addColorStop(1, '#14532d');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.roundRect(-16, -6.5, 32, 13, 6.5);
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'corn': {
      ctx.rotate(0.4);
      const cg = ctx.createLinearGradient(-8, -14, 8, 14);
      cg.addColorStop(0, '#fef08a');
      cg.addColorStop(0.55, '#eab308');
      cg.addColorStop(1, '#a16207');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(0, -2, 7.5, 14.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      drawLeaf(ctx, -3, 13, -2.1, 16, 6);
      drawLeaf(ctx, 3, 13, -1.0, 16, 6);
      break;
    }
    case 'eggplant': {
      ctx.rotate(0.45);
      const eg = ctx.createRadialGradient(-4, -3, 2, 0, 2, 18);
      eg.addColorStop(0, '#d8b4fe');
      eg.addColorStop(0.5, '#7e22ce');
      eg.addColorStop(1, '#3b0764');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.bezierCurveTo(9, -13, 12, 15, 0, 16);
      ctx.bezierCurveTo(-12, 15, -9, -13, 0, -13);
      ctx.fill();
      ctx.strokeStyle = '#2e1065';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawLeaf(ctx, 0, -12, -2.5, 10, 4.5);
      drawLeaf(ctx, 0, -12, -0.6, 10, 4.5);
      break;
    }
    case 'broccoli': {
      ctx.fillStyle = '#86efac';
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-5, 2, 10, 13, 4);
      ctx.fill();
      ctx.stroke();
      for (const [bx, by, br] of [[-8, -2, 7.5], [8, -2, 7.5], [0, -7, 8.5], [-4, -4, 7], [4, -4, 7]]) {
        drawGlossSphere(ctx, bx, by, br, '#bbf7d0', '#22c55e', '#15803d', '#14532d');
      }
      break;
    }
    case 'avocado': {
      const ag = ctx.createLinearGradient(-12, -15, 12, 16);
      ag.addColorStop(0, '#4d7c0f');
      ag.addColorStop(1, '#1a2e05');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.bezierCurveTo(10, -15, 14, 16, 0, 16);
      ctx.bezierCurveTo(-14, 16, -10, -15, 0, -16);
      ctx.fill();
      ctx.fillStyle = '#d9f99d';
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.bezierCurveTo(8, -12, 11, 13, 0, 13);
      ctx.bezierCurveTo(-11, 13, -8, -12, 0, -13);
      ctx.fill();
      drawGlossSphere(ctx, 0, 4.5, 6.2, '#d97706', '#92400e', '#451a03', '#451a03');
      break;
    }
    case 'mango': {
      ctx.rotate(-0.4);
      const mg = ctx.createLinearGradient(-12, -10, 12, 12);
      mg.addColorStop(0, '#f43f5e');
      mg.addColorStop(0.5, '#fb923c');
      mg.addColorStop(1, '#facc15');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'kiwi': {
      drawGlossSphere(ctx, 0, 0, 15, '#bbf7d0', '#65a30d', '#3f6212', '#78350f');
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 8.5, Math.sin(a) * 8.5, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'coconut': {
      drawGlossSphere(ctx, 0, 0, 15.5, '#a16207', '#713f12', '#422006', '#291509');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pineapple': {
      drawLeaf(ctx, 0, -10, -2.3, 12, 4.5);
      drawLeaf(ctx, 0, -10, -1.57, 13, 4.5);
      drawLeaf(ctx, 0, -10, -0.85, 12, 4.5);
      const pg = ctx.createRadialGradient(-4, -2, 2, 0, 3, 16);
      pg.addColorStop(0, '#fef08a');
      pg.addColorStop(0.55, '#eab308');
      pg.addColorStop(1, '#a16207');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(0, 4, 11.5, 13.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(133,77,14,0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-7, -4); ctx.lineTo(7, 10);
      ctx.moveTo(7, -4); ctx.lineTo(-7, 10);
      ctx.stroke();
      break;
    }
    case 'watermelon':
    default: {
      ctx.rotate(0.22);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -4, 17, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#dcfce7';
      ctx.beginPath();
      ctx.arc(0, -4, 14.3, 0.13 * Math.PI, 0.87 * Math.PI);
      ctx.closePath();
      ctx.fill();
      const wg = ctx.createLinearGradient(0, -4, 0, 12);
      wg.addColorStop(0, '#fda4af');
      wg.addColorStop(0.5, '#f43f5e');
      wg.addColorStop(1, '#be123c');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(0, -4, 12.4, 0.14 * Math.PI, 0.86 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      for (const [sx, sy] of [[-5, 2], [0, 4], [5, 2], [-2.5, 0], [2.5, 0]]) {
        ctx.beginPath();
        ctx.ellipse(sx, sy, 1.0, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

const FRUIT_SPRITES = FRUIT_SPECS.map((f) => {
  const c = document.createElement('canvas');
  c.width = 52;
  c.height = 52;
  const x = c.getContext('2d');
  x.shadowColor = 'rgba(0, 0, 0, 0.28)';
  x.shadowBlur = 4;
  x.shadowOffsetY = 2;
  x.translate(26, 26);
  renderFruitArt(x, f.kind);
  return { canvas: c, r: f.r, val: f.val };
});

// Pre-rendered glossy on-map Powerup Orbs
const POWERUP_SPRITES = {};
['magnet', 'zoom', 'freeBoost'].forEach((type) => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const cx = 32;
  const cy = 32;

  const palette = {
    magnet: ['#fda4af', '#f43f5e', '#9f1239', '#fecdd3'],
    zoom: ['#7dd3fc', '#0284c7', '#0c4a6e', '#bae6fd'],
    freeBoost: ['#fef08a', '#f59e0b', '#b45309', '#fef9c3']
  }[type];

  const orbGrad = ctx.createRadialGradient(cx - 7, cy - 8, 2, cx, cy, 22);
  orbGrad.addColorStop(0, palette[0]);
  orbGrad.addColorStop(0.55, palette[1]);
  orbGrad.addColorStop(1, palette[2]);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.32)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = palette[3];
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 21, 0, Math.PI * 2);
  ctx.stroke();

  // Top gloss reflection
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy - 10, 9, 4.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Crisp vector icon inside orb
  ctx.save();
  ctx.translate(cx, cy);
  if (type === 'magnet') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-8, 2);
    ctx.arc(0, 2, 8, Math.PI, 0, true);
    ctx.lineTo(8, -7);
    ctx.lineTo(3, -7);
    ctx.lineTo(3, 2);
    ctx.arc(0, 2, 3, 0, Math.PI, false);
    ctx.lineTo(-3, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-8, -10, 5, 3.5);
    ctx.fillRect(3, -10, 5, 3.5);
  } else if (type === 'zoom') {
    ctx.rotate(-0.5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-11, -3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-5, -4.5, 9, 9, 2);
    ctx.roundRect(3, -6, 8, 12, 2.5);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, -12);
    ctx.lineTo(-8, 1);
    ctx.lineTo(-1, 1);
    ctx.lineTo(-3, 12);
    ctx.lineTo(8, -1);
    ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  POWERUP_SPRITES[type] = c;
});

// Pre-rendered 3D Embossed Golden Coin Sprite for fast canvas drawing
const COIN_SPRITE = (() => {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext('2d');
  const cx = 24;
  const cy = 22.5;

  // Drop shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.arc(cx, cy + 4.5, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3D bottom thickness rim
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(cx, cy + 3.2, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(cx, cy + 1.8, 16, 0, Math.PI * 2);
  ctx.fill();

  // Main outer gold face
  const grad = ctx.createRadialGradient(cx - 5, cy - 6, 2, cx, cy, 17);
  grad.addColorStop(0, '#fffbeb');
  grad.addColorStop(0.32, '#fde047');
  grad.addColorStop(0.75, '#f59e0b');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Recessed inner medallion
  const innerGrad = ctx.createRadialGradient(cx + 4, cy + 5, 2, cx, cy, 12);
  innerGrad.addColorStop(0, '#fbbf24');
  innerGrad.addColorStop(0.65, '#d97706');
  innerGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 11.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Embossed royal crown emblem
  const crownGrad = ctx.createLinearGradient(cx - 6, cy - 5, cx + 6, cy + 5);
  crownGrad.addColorStop(0, '#ffffff');
  crownGrad.addColorStop(0.5, '#fef08a');
  crownGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = crownGrad;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.0;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 6.5, cy + 3.5);
  ctx.lineTo(cx - 5.3, cy - 3.6);
  ctx.lineTo(cx - 2.2, cy - 0.8);
  ctx.lineTo(cx, cy - 5.2);
  ctx.lineTo(cx + 2.2, cy - 0.8);
  ctx.lineTo(cx + 5.3, cy - 3.6);
  ctx.lineTo(cx + 6.5, cy + 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(cx - 6.3, cy + 4.4, 12.6, 1.8);

  // Specular top-left highlight
  ctx.save();
  ctx.translate(cx - 5.2, cy - 7.5);
  ctx.rotate(-0.55);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.0, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return c;
})();

// ==========================================
// BRIGHT LUMINOUS GREEN ARENA TILE TEXTURE
// ==========================================
const ARENA_TILE_CANVAS = (() => {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');

  // Fresh bright luminous green meadow tone
  ctx.fillStyle = '#47a85d';
  ctx.fillRect(0, 0, 160, 160);

  // Subtle soft checkered tile variation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.fillRect(0, 0, 80, 80);
  ctx.fillRect(80, 80, 80, 80);

  // Clean soft grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 0);
  ctx.lineTo(80, 160);
  ctx.moveTo(0, 80);
  ctx.lineTo(160, 80);
  ctx.moveTo(160, 0);
  ctx.lineTo(160, 160);
  ctx.moveTo(0, 160);
  ctx.lineTo(160, 160);
  ctx.stroke();

  return c;
})();

// ==========================================
// WEB AUDIO SYNTHESIZER (NO EXTERNAL FILES)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.musicVol = Number(localStorage.getItem('vw_music_vol') ?? 100);
    this.sfxVol = Number(localStorage.getItem('vw_sfx_vol') ?? 100);
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMusicVol(val) {
    this.musicVol = Math.max(0, Math.min(100, Number(val)));
    localStorage.setItem('vw_music_vol', String(this.musicVol));
    if (this.musicVol <= 0) {
      this.stopMusic();
    } else if (!this.musicTimer && this.ctx) {
      this.startMusic();
    }
  }

  setSfxVol(val) {
    this.sfxVol = Math.max(0, Math.min(100, Number(val)));
    localStorage.setItem('vw_sfx_vol', String(this.sfxVol));
  }

  playTone(freq, endFreq, dur, type = 'sine', vol = 0.14) {
    if (this.sfxVol <= 0) return;
    this.ensure();
    if (!this.ctx) return;
    const scaledVol = vol * (this.sfxVol / 100);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    }
    gain.gain.setValueAtTime(Math.max(0.0005, scaledVol), now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  playClick() { this.playTone(540, 720, 0.06, 'triangle', 0.12); }
  playEat() { this.playTone(420 + Math.random() * 140, 760, 0.055, 'sine', 0.08); }
  playPowerup() {
    this.playTone(523, 659, 0.12, 'triangle', 0.16);
    setTimeout(() => this.playTone(659, 1046, 0.18, 'triangle', 0.16), 75);
  }
  playCoin() {
    this.playTone(987, 1318, 0.14, 'sine', 0.15);
  }
  playKill() {
    this.playTone(330, 660, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(660, 880, 0.2, 'triangle', 0.15), 90);
  }
  playDie() {
    this.playTone(300, 75, 0.45, 'sawtooth', 0.18);
  }

  startMusic() {
    if (this.musicVol <= 0 || this.musicTimer) return;
    this.ensure();
    const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0];
    this.musicTimer = setInterval(() => {
      if (this.musicVol <= 0 || !this.ctx || this.ctx.state !== 'running') return;
      const f = notes[this.musicStep % notes.length];
      this.musicStep++;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      const mVol = 0.032 * (this.musicVol / 100);
      gain.gain.setValueAtTime(Math.max(0.0003, mVol), now);
      gain.gain.exponentialRampToValueAtTime(0.0003, now + 0.34);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }, 380);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
const sfx = new SoundFX();

// ==========================================
// FULLSCREEN HELPER (AUTO ON FIRST TAP)
// ==========================================
function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function requestAppFullscreen() {
  if (isFullscreenActive()) return;
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (fn) {
    fn.call(el).catch(() => {});
  }
}

function toggleAppFullscreen() {
  if (isFullscreenActive()) {
    const exitFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exitFn) exitFn.call(document).catch(() => {});
  } else {
    requestAppFullscreen();
  }
}

document.addEventListener('pointerdown', () => {
  sfx.ensure();
  sfx.startMusic();
  requestAppFullscreen();
}, { once: true });

// ==========================================
// CLIENT STATE & NETWORK
// ==========================================
const gameContainer = document.getElementById('gameContainer');
const gameCanvas = document.getElementById('gameCanvas');
const gctx = gameCanvas.getContext('2d');

let ws = null;
let myId = null;
let arenaHalf = 3000;
let isPlaying = false;
let currentRoomCode = 'PUBLIC';
let isPrivateRoom = false;

let foodsMap = new Map();
let powerups = [];
let coins = [];
let playersMap = new Map();
let localInventory = { magnet: 0, zoom: 0, freeBoost: 0 };
let localEffects = { magnet: 0, zoom: 0, freeBoost: 0 };
let floatingTexts = [];
let flyingFoods = [];
let arenaPattern = null;

// Virtual Joystick & Input state
let steerAngle = 0;
let isBoosting = false;
let cameraZoom = 1;
let cameraX = 0;
let cameraY = 0;
let lastInputSend = 0;
let lastEatSend = 0;
let pendingEatIds = [];
let lastFoodSpawnPos = { x: 0, y: 0 };

const joystick = {
  active: false,
  pointerId: null,
  originX: 0,
  originY: 0,
  knobX: 0,
  knobY: 0,
  radius: 52
};
let boostPointerId = null;
let lastTapTime = 0;

function resizeGameCanvas() {
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeGameCanvas);
resizeGameCanvas();

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

function ensureSocketConnected(onReady) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (onReady) onReady();
    return;
  }
  if (ws && ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener('open', () => { if (onReady) onReady(); }, { once: true });
    return;
  }

  ws = new WebSocket(getWsUrl());

  ws.onopen = () => {
    if (onReady) onReady();
  };

  ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    if (msg.type === 'room_created') {
      if (typeof handleRoomCreated === 'function') handleRoomCreated(msg.roomCode);
    } else if (msg.type === 'room_ready') {
      if (typeof handleRoomReady === 'function') handleRoomReady(msg.roomCode);
    } else if (msg.type === 'room_error') {
      if (typeof handleRoomError === 'function') handleRoomError(msg.reason);
    } else if (msg.type === 'room_peers') {
      if (typeof handleRoomPeers === 'function') handleRoomPeers(msg.peers);
    } else if (msg.type === 'rtc_signal') {
      if (typeof handleRtcSignal === 'function') handleRtcSignal(msg.from, msg.signal);
    } else if (msg.type === 'joined') {
      myId = msg.id;
      arenaHalf = msg.arenaHalf || 3000;
      currentRoomCode = msg.roomCode || 'PUBLIC';
      isPrivateRoom = Boolean(msg.isPrivate);

      foodsMap.clear();
      if (Array.isArray(msg.foods)) {
        for (let i = 0; i < msg.foods.length; i++) {
          const item = msg.foods[i];
          if (Array.isArray(item)) {
            foodsMap.set(item[0], { id: item[0], x: item[1], y: item[2], t: item[3] });
          } else {
            foodsMap.set(item.id, item);
          }
        }
      }
      powerups = msg.powerups || [];
      coins = msg.coins || [];
      localInventory = { magnet: 0, zoom: 0, freeBoost: 0 };
      localEffects = { magnet: 0, zoom: 0, freeBoost: 0 };
      flyingFoods = [];
      updatePowerupHud();

      if (typeof updateVoiceBarVisibility === 'function') {
        updateVoiceBarVisibility(isPrivateRoom, currentRoomCode);
      }
    } else if (msg.type === 'state') {
      applyServerState(msg);
    } else if (msg.type === 'powerup_state') {
      if (msg.inventory) localInventory = msg.inventory;
      if (msg.effects) localEffects = msg.effects;
      if (msg.picked) {
        sfx.playPowerup();
        showFloatingText(t('bonusPicked'), '#38bdf8');
      }
      updatePowerupHud();
    } else if (msg.type === 'coin_picked') {
      sfx.playCoin();
      const amt = msg.amount || 1;
      profile.coins += amt;
      saveProfile();
      refreshLobbyUI();
      showFloatingText(`+${amt}`, '#fde047');
    } else if (msg.type === 'kill_credit') {
      sfx.playKill();
      showKillToast(msg.victimName || 'Worm');
    } else if (msg.type === 'died') {
      sfx.playDie();
      handlePlayerDied(msg.score || 0, msg.kills || 0);
    }
  };

  ws.onclose = () => {
    setTimeout(() => {
      if (isPlaying) ensureSocketConnected(() => sendJoinGame(currentRoomCode));
    }, 1500);
  };
}

function sendJoinGame(roomCode = 'PUBLIC') {
  currentRoomCode = roomCode || 'PUBLIC';
  const skin = SKINS.find((s) => s.id === profile.selectedSkin) || SKINS[0];
  let spawnHint = null;
  if (typeof getLobbyWormSpawn === 'function') {
    spawnHint = getLobbyWormSpawn(arenaHalf);
    if (spawnHint && typeof spawnHint.angle === 'number') {
      steerAngle = spawnHint.angle;
    }
  }

  ensureSocketConnected(() => {
    ws.send(JSON.stringify({
      type: 'join',
      roomCode: currentRoomCode,
      name: profile.name,
      colors: skin.colors,
      x: spawnHint ? spawnHint.x : undefined,
      y: spawnHint ? spawnHint.y : undefined,
      angle: spawnHint ? spawnHint.angle : undefined
    }));
  });
}

function calcClientRadius(score) {
  return Math.min(30, 10.5 + Math.pow(Math.max(0, score), 0.34) * 0.78);
}

function calcClientSegmentsCount(score) {
  return Math.min(560, Math.floor(14 + Math.pow(Math.max(0, score), 0.56) * 2.5));
}

function rebuildSmoothSegments(p) {
  const targetSegs = calcClientSegmentsCount(p.score);
  const r = calcClientRadius(p.score);
  const spacing = Math.max(2.6, r * 0.22);
  if (!p.path || p.path.length === 0) {
    p.path = [{ x: p.renderX, y: p.renderY }];
  }
  p.path[0].x = p.renderX;
  p.path[0].y = p.renderY;

  const newSegs = [{ x: p.renderX, y: p.renderY }];
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

function applyServerState(msg) {
  if (Array.isArray(msg.eaten)) {
    for (let i = 0; i < msg.eaten.length; i++) {
      foodsMap.delete(msg.eaten[i]);
    }
  }
  if (Array.isArray(msg.spawned)) {
    for (let i = 0; i < msg.spawned.length; i++) {
      const item = msg.spawned[i];
      if (Array.isArray(item)) {
        foodsMap.set(item[0], { id: item[0], x: item[1], y: item[2], t: item[3] });
      } else {
        foodsMap.set(item.id, item);
      }
    }
  }
  if (msg.powerups) powerups = msg.powerups;
  if (msg.coins) coins = msg.coins;

  const activeIds = new Set();
  for (const sp of msg.players) {
    activeIds.add(sp.id);
    let local = playersMap.get(sp.id);
    if (!local) {
      const r = calcClientRadius(sp.score);
      const spacing = Math.max(2.6, r * 0.22);
      const initPath = [];
      if (sp.segments && sp.segments.length > 1) {
        for (let i = 0; i < sp.segments.length; i++) {
          initPath.push({ x: sp.segments[i].x, y: sp.segments[i].y });
        }
      } else {
        const count = calcClientSegmentsCount(sp.score);
        for (let i = 0; i < count; i++) {
          initPath.push({
            x: sp.x - Math.cos(sp.angle) * i * spacing,
            y: sp.y - Math.sin(sp.angle) * i * spacing
          });
        }
      }
      local = {
        ...sp,
        renderX: sp.x,
        renderY: sp.y,
        renderAngle: sp.angle,
        targetX: sp.x,
        targetY: sp.y,
        targetAngle: sp.angle,
        path: initPath,
        segments: initPath.map((pt) => ({ ...pt }))
      };
      playersMap.set(sp.id, local);
      if (sp.id === myId) {
        cameraX = sp.x;
        cameraY = sp.y;
        lastFoodSpawnPos = { x: sp.x, y: sp.y };
      }
    } else {
      local.name = sp.name;
      local.colors = sp.colors;
      local.targetX = sp.x;
      local.targetY = sp.y;
      local.targetAngle = sp.angle;
      local.boosting = sp.boosting;
      local.score = sp.score;
      local.shield = sp.shield;
    }
  }
  for (const id of playersMap.keys()) {
    if (!activeIds.has(id)) playersMap.delete(id);
  }
}

function showFloatingText(text, color = '#fff') {
  const me = playersMap.get(myId);
  if (!me) return;
  floatingTexts.push({
    x: me.renderX,
    y: me.renderY - 26,
    text,
    color,
    alpha: 1.0
  });
}

function showKillToast(victimName) {
  const container = document.getElementById('killToastContainer');
  const el = document.createElement('div');
  el.className = 'kill-toast';
  el.textContent = `⚔️ ${t('defeated')} ${victimName}!`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ==========================================
// POWERUP HUD & ACTIVATION
// ==========================================
const activeEffectsBox = document.getElementById('activeEffects');
const PU_TYPES = ['magnet', 'zoom', 'freeBoost'];

function createPowerupHudSlots() {
  activeEffectsBox.innerHTML = '';
  PU_TYPES.forEach((type) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'pu-hud-slot';
    slot.id = `puSlot_${type}`;
    slot.innerHTML = `
      <span class="pu-hud-svg">${POWERUP_SVGS[type]}</span>
      <span class="pu-hud-count" id="puCount_${type}">0</span>
      <span class="pu-hud-timer" id="puTimer_${type}"></span>
    `;
    slot.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      activatePowerup(type);
    });
    activeEffectsBox.appendChild(slot);
  });
}
createPowerupHudSlots();

function activatePowerup(type) {
  if (!isPlaying) return;
  if ((localInventory[type] || 0) <= 0) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'use_powerup', powerup: type }));
  }
}

function updatePowerupHud() {
  PU_TYPES.forEach((type) => {
    const slot = document.getElementById(`puSlot_${type}`);
    const countEl = document.getElementById(`puCount_${type}`);
    const timerEl = document.getElementById(`puTimer_${type}`);
    if (!slot || !countEl || !timerEl) return;

    const count = localInventory[type] || 0;
    const activeSec = localEffects[type] || 0;

    countEl.textContent = String(count);
    slot.classList.toggle('has-stock', count > 0);
    slot.classList.toggle('is-active', activeSec > 0);

    if (activeSec > 0) {
      timerEl.style.display = 'block';
      timerEl.textContent = `${Math.ceil(activeSec)}s`;
    } else {
      timerEl.style.display = 'none';
    }
  });
}

// ==========================================
// START, GAME OVER & LOBBY TRANSITIONS
// ==========================================
function startGame(roomCode = 'PUBLIC') {
  sfx.playClick();
  requestAppFullscreen();
  lobbyScreen.style.display = 'none';
  lobbyCanvas.style.display = 'none';
  gameOverScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  resizeGameCanvas();

  playersMap.clear();
  foodsMap.clear();
  flyingFoods = [];
  isPlaying = true;
  isBoosting = false;
  joystick.active = false;
  joystick.pointerId = null;
  boostPointerId = null;
  cameraZoom = 1;

  sendJoinGame(roomCode);
}

function handlePlayerDied(score, kills) {
  isPlaying = false;
  isBoosting = false;
  joystick.active = false;
  joystick.pointerId = null;
  boostPointerId = null;

  const earnedCoins = Math.max(5, Math.floor(score / 25) + kills * 10);
  const earnedXp = Math.max(10, Math.floor(score / 10) + kills * 20);

  profile.coins += earnedCoins;
  if (score > profile.bestScore) profile.bestScore = score;
  addXp(earnedXp);
  saveProfile();
  refreshLobbyUI();

  document.getElementById('finalScore').textContent = score;
  document.getElementById('goRewardText').textContent = `+${earnedCoins} 🪙  |  +${earnedXp} XP`;
  gameOverScreen.style.display = 'flex';
}

document.getElementById('startGameBtn').addEventListener('click', () => startGame('PUBLIC'));

document.getElementById('playAgainBtn').addEventListener('click', () => {
  sfx.playClick();
  requestAppFullscreen();
  gameOverScreen.style.display = 'none';
  playersMap.clear();
  flyingFoods = [];
  isPlaying = true;
  sendJoinGame(currentRoomCode);
});

document.getElementById('goLobbyBtn').addEventListener('click', () => {
  sfx.playClick();
  isPlaying = false;
  if (typeof leaveVoiceRoom === 'function') leaveVoiceRoom();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'leave' }));
  }
  currentRoomCode = 'PUBLIC';
  isPrivateRoom = false;
  gameOverScreen.style.display = 'none';
  gameContainer.style.display = 'none';
  lobbyCanvas.style.display = 'block';
  lobbyScreen.style.display = 'block';
  if (typeof resizeLobby === 'function') resizeLobby();
});

document.getElementById('gameFsBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playClick();
  toggleAppFullscreen();
});