// ============================================================
// Pixel Fox Runner - Infinite Runner
// Pure HTML5 Canvas + vanilla JS
// 8-bit style fox girl (Ani)
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// -------------------- CONFIG --------------------
const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;
const BASE_GROUND = 220;
const GRAVITY = 0.55;
const JUMP_FORCE = -10.5;
const START_SPEED = 2.8;
const MAX_SPEED = 9.2;
const SPEED_INCREASE = 0.00032;

let canvasScale = 1;

// -------------------- AUDIO --------------------
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playBeep(freq, duration, type = 'square', volume = 0.08) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxJump()    { playBeep(480, 0.08, 'square', 0.07); setTimeout(() => playBeep(620, 0.1, 'square', 0.05), 40); }
function sfxCoin()    { playBeep(880, 0.06, 'square', 0.06); setTimeout(() => playBeep(1200, 0.1, 'square', 0.05), 50); }
function sfxHit()     { playBeep(180, 0.15, 'sawtooth', 0.09); setTimeout(() => playBeep(120, 0.2, 'sawtooth', 0.06), 60); }
function sfxStomp()   { playBeep(220, 0.06, 'square', 0.08); setTimeout(() => playBeep(160, 0.12, 'triangle', 0.07), 40); }
function sfxHeart()   { playBeep(660, 0.08, 'sine', 0.07); setTimeout(() => playBeep(880, 0.12, 'sine', 0.05), 70); }
function sfxGameOver(){ playBeep(300, 0.2, 'sawtooth', 0.08); setTimeout(() => playBeep(200, 0.3, 'sawtooth', 0.07), 150); setTimeout(() => playBeep(120, 0.4, 'sawtooth', 0.06), 320); }
function sfxWater()   { playBeep(140, 0.12, 'triangle', 0.07); setTimeout(() => playBeep(90, 0.18, 'sawtooth', 0.05), 50); }

function playStartJingle() {
  const notes = [
    {f: 523, d: 0.12}, {f: 659, d: 0.12}, {f: 784, d: 0.12},
    {f: 1047, d: 0.18}, {f: 784, d: 0.1}, {f: 880, d: 0.15}, {f: 1047, d: 0.25}
  ];
  let t = 0;
  notes.forEach(n => {
    setTimeout(() => playBeep(n.f, n.d, 'square', 0.06), t * 1000);
    t += n.d * 0.85;
  });
}

// -------------------- STATE --------------------
let state = 'start';
let score = 0;
let distance = 0;
let coins = 0;
let lives = 3;
let invuln = 0;
let speed = START_SPEED;
let frameCount = 0;

// -------------------- PLAYER --------------------
const player = {
  x: 70,
  y: BASE_GROUND,
  w: 16,
  h: 24,
  vy: 0,
  onGround: true,
  lockedGroundY: BASE_GROUND,
  animFrame: 0,
  animTimer: 0
};

// -------------------- WORLD --------------------
let obstacles = [];
let collectibles = [];
let particles = [];
let terrain = [];

let bgFar = 0;
let bgMid = 0;
let bgNear = 0;

// -------------------- INPUT --------------------
function onJump() {
  initAudio();
  if (state === 'start') { startGame(); return; }
  if (state === 'gameover') { restartGame(); return; }
  if (state === 'playing' && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    sfxJump();
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    onJump();
  }
});
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  onJump();
});

// -------------------- RESIZE --------------------
function resize() {
  const scaleX = window.innerWidth / GAME_WIDTH;
  const scaleY = window.innerHeight / GAME_HEIGHT;
  canvasScale = Math.min(scaleX, scaleY) * 0.95;
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = (GAME_WIDTH * canvasScale) + 'px';
  canvas.style.height = (GAME_HEIGHT * canvasScale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// -------------------- DRAW HELPERS --------------------
const C = {
  skin: '#ffccaa', hair: '#22cc66', hairDark: '#118844',
  onesie: '#ff8800', white: '#ffffff', purple: '#aa44ff', tail: '#cc6622'
};

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawFox(pxX, pxY, frame, scale = 1) {
  const s = scale;
  const x = Math.floor(pxX);
  const y = Math.floor(pxY);

  px(x - 4*s, y + 12*s, 6*s, 4*s, C.tail);
  px(x - 6*s, y + 10*s, 4*s, 4*s, C.tail);

  px(x + 3*s, y + 10*s, 10*s, 10*s, C.onesie);
  px(x + 2*s, y + 11*s, 12*s, 8*s, C.onesie);
  px(x + 2*s, y + 4*s, 12*s, 8*s, C.onesie);
  px(x + 1*s, y + 5*s, 14*s, 6*s, C.onesie);

  px(x + 2*s, y + 1*s, 4*s, 5*s, C.onesie);
  px(x + 10*s, y + 1*s, 4*s, 5*s, C.onesie);
  px(x + 3*s, y + 2*s, 2*s, 3*s, C.white);
  px(x + 11*s, y + 2*s, 2*s, 3*s, C.white);

  px(x + 4*s, y + 6*s, 8*s, 6*s, C.skin);

  px(x + 1*s, y + 5*s, 3*s, 8*s, C.hair);
  px(x + 12*s, y + 5*s, 3*s, 8*s, C.hair);
  px(x + 0*s, y + 7*s, 2*s, 6*s, C.hairDark);
  px(x + 14*s, y + 7*s, 2*s, 6*s, C.hairDark);

  px(x + 5*s, y + 7*s, 2*s, 2*s, C.purple);
  px(x + 9*s, y + 7*s, 2*s, 2*s, C.purple);
  px(x + 5*s, y + 7*s, 1*s, 1*s, C.white);
  px(x + 9*s, y + 7*s, 1*s, 1*s, C.white);

  if (frame === 0) {
    px(x + 4*s, y + 20*s, 3*s, 4*s, C.onesie);
    px(x + 9*s, y + 20*s, 3*s, 4*s, C.onesie);
  } else if (frame === 1) {
    px(x + 3*s, y + 19*s, 3*s, 5*s, C.onesie);
    px(x + 10*s, y + 20*s, 3*s, 4*s, C.onesie);
  } else if (frame === 2) {
    px(x + 4*s, y + 20*s, 3*s, 4*s, C.onesie);
    px(x + 9*s, y + 19*s, 3*s, 5*s, C.onesie);
  } else {
    px(x + 3*s, y + 18*s, 4*s, 4*s, C.onesie);
    px(x + 9*s, y + 18*s, 4*s, 4*s, C.onesie);
  }

  px(x + 4*s, y + 23*s, 3*s, 1*s, C.white);
  px(x + 9*s, y + 23*s, 3*s, 1*s, C.white);
}

// -------------------- TERRAIN --------------------
function initTerrain() {
  terrain = [];
  terrain.push({ x: -40, w: 180, top: BASE_GROUND, type: 'ground' });
  generateMoreTerrain();
}

function generateMoreTerrain() {
  while (true) {
    const last = terrain[terrain.length - 1];
    if (last.x + last.w > GAME_WIDTH + 450) break;

    const nextX = last.x + last.w;
    const roll = Math.random();

    if (roll < 0.22 && last.type === 'ground') {
      const waterW = 22 + Math.floor(Math.random() * 12);
      terrain.push({ x: nextX, w: waterW, top: BASE_GROUND + 6, type: 'water' });
      continue;
    }

    let newTop = last.top;
    const heightRoll = Math.random();

    if (heightRoll < 0.38) {
      newTop = Math.max(130, last.top - (22 + Math.floor(Math.random() * 36)));
    } else if (heightRoll < 0.62) {
      newTop = Math.min(BASE_GROUND, last.top + (18 + Math.floor(Math.random() * 30)));
    }

    newTop = Math.max(125, Math.min(BASE_GROUND, newTop));
    const segW = 40 + Math.floor(Math.random() * 80);
    terrain.push({ x: nextX, w: segW, top: newTop, type: 'ground' });
  }
}

function getTerrainUnder(px) {
  for (let i = 0; i < terrain.length; i++) {
    const t = terrain[i];
    if (px >= t.x && px < t.x + t.w) return t;
  }
  return null;
}

function getGroundY(px) {
  const t = getTerrainUnder(px);
  if (!t) return BASE_GROUND + 90;
  if (t.type === 'water') return t.top;
  return t.top;
}

// -------------------- DRAW WORLD --------------------
function drawWorld() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#16213e';
  for (let i = -1; i < 7; i++) {
    const bx = ((i * 130) - (bgFar % 130));
    ctx.beginPath();
    ctx.moveTo(bx, 200);
    ctx.lineTo(bx + 45, 155);
    ctx.lineTo(bx + 90, 175);
    ctx.lineTo(bx + 130, 200);
    ctx.fill();
  }

  for (let i = -1; i < 9; i++) {
    const tx = ((i * 75) - (bgMid % 75));
    px(tx + 14, 170, 6, 50, '#3d2914');
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.moveTo(tx, 175);
    ctx.lineTo(tx + 17, 140);
    ctx.lineTo(tx + 34, 175);
    ctx.fill();
  }

  for (const t of terrain) {
    if (t.x + t.w < -10 || t.x > GAME_WIDTH + 10) continue;

    if (t.type === 'ground') {
      ctx.fillStyle = '#2d1b0e';
      ctx.fillRect(t.x, t.top, t.w + 1, GAME_HEIGHT - t.top + 12);
      ctx.fillStyle = '#40916c';
      ctx.fillRect(t.x, t.top, t.w + 1, 6);
      ctx.fillStyle = '#3d2914';
      for (let gx = t.x + 8; gx < t.x + t.w - 4; gx += 16) {
        px(gx, t.top + 8, 5, 3, '#3d2914');
      }
    } else {
      ctx.fillStyle = '#0a3d62';
      ctx.fillRect(t.x, t.top, t.w + 1, GAME_HEIGHT - t.top + 12);
      ctx.fillStyle = '#1e90ff';
      ctx.fillRect(t.x, t.top, t.w + 1, 5);
      ctx.fillStyle = '#4fc3f7';
      for (let wx = t.x + 2; wx < t.x + t.w; wx += 7) {
        px(wx, t.top + 1, 3, 2, '#4fc3f7');
      }
    }
  }
}

// -------------------- SPAWN --------------------
function spawnObstacle() {
  const aheadX = GAME_WIDTH + 30;
  const t = getTerrainUnder(aheadX);
  if (t && t.type === 'water') return;

  const groundY = getGroundY(aheadX);
  const type = Math.random();
  let o;

  if (type < 0.40) {
    o = { type: 'crate', x: aheadX, y: groundY - 20, w: 20, h: 20 };
  } else if (type < 0.70) {
    o = { type: 'spikes', x: aheadX, y: groundY - 12, w: 24, h: 12 };
  } else {
    o = { type: 'bird', x: aheadX, y: groundY - 55 - Math.random() * 50, w: 18, h: 12, bob: Math.random() * 6 };
  }
  obstacles.push(o);
}

function spawnCollectible() {
  const aheadX = GAME_WIDTH + 20;
  const groundY = getGroundY(aheadX);
  const type = Math.random() < 0.72 ? 'coin' : 'heart';

  collectibles.push({
    type,
    x: aheadX,
    y: groundY - 28 - Math.random() * 60,
    w: 12,
    h: 12,
    collected: false
  });
}

// -------------------- DRAW OBJECTS --------------------
function drawObstacle(o) {
  if (o.type === 'crate') {
    px(o.x, o.y, o.w, o.h, '#8B4513');
    px(o.x + 2, o.y + 2, o.w - 4, o.h - 4, '#A0522D');
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x + 4, o.y + 4);
    ctx.lineTo(o.x + o.w - 4, o.y + o.h - 4);
    ctx.moveTo(o.x + o.w - 4, o.y + 4);
    ctx.lineTo(o.x + 4, o.y + o.h - 4);
    ctx.stroke();
  } else if (o.type === 'spikes') {
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(o.x + i * 6, o.y + o.h);
      ctx.lineTo(o.x + i * 6 + 3, o.y);
      ctx.lineTo(o.x + i * 6 + 6, o.y + o.h);
      ctx.fill();
    }
  } else if (o.type === 'bird') {
    o.bob += 0.15;
    const by = o.y + Math.sin(o.bob) * 4;
    px(o.x, by + 4, 14, 6, '#222');
    px(o.x + 10, by + 2, 6, 4, '#222');
    px(o.x + 2, by + 2, 4, 2, '#fff');
    px(o.x + 4, by, 8, 3, '#444');
  }
}

function drawCollectible(c) {
  if (c.collected) return;
  if (c.type === 'coin') {
    px(c.x, c.y, 12, 12, '#ffd700');
    px(c.x + 2, c.y + 2, 8, 8, '#ffec8b');
    px(c.x + 4, c.y + 4, 4, 4, '#ffd700');
  } else {
    px(c.x + 1, c.y + 3, 4, 4, '#ff3366');
    px(c.x + 7, c.y + 3, 4, 4, '#ff3366');
    px(c.x + 3, c.y + 5, 6, 6, '#ff3366');
  }
}

// -------------------- PARTICLES --------------------
function spawnHitParticles(x, y, color1 = '#ff8800', color2 = '#22cc66') {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5 - 2,
      life: 18 + Math.random()*12, color: Math.random()>0.5 ? color1 : color2, size: 2+Math.random()*2
    });
  }
}
function spawnStompParticles(x, y) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*6, vy: -Math.random()*5 - 1,
      life: 20 + Math.random()*15, color: Math.random()>0.4 ? '#ffee88' : '#ffffff', size: 2+Math.random()*3
    });
  }
}
function spawnWaterSplash(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*4, vy: -Math.random()*4 - 1,
      life: 15 + Math.random()*10, color: Math.random()>0.5 ? '#4fc3f7' : '#1e90ff', size: 2+Math.random()*2
    });
  }
}

// -------------------- GAME FLOW --------------------
function startGame() {
  state = 'playing';
  score = 0;
  distance = 0;
  coins = 0;
  lives = 3;
  speed = START_SPEED;
  obstacles = [];
  collectibles = [];
  particles = [];
  invuln = 0;
  player.y = BASE_GROUND;
  player.vy = 0;
  player.onGround = true;
  player.lockedGroundY = BASE_GROUND;
  initTerrain();
  playStartJingle();
}

function restartGame() {
  startGame();
}

function gameOver() {
  state = 'gameover';
  sfxGameOver();
}

// -------------------- UPDATE --------------------
function update() {
  frameCount++;
  if (state !== 'playing') return;

  speed = Math.min(MAX_SPEED, START_SPEED + distance * SPEED_INCREASE);

  generateMoreTerrain();

  for (const t of terrain) t.x -= speed;
  while (terrain.length > 0 && terrain[0].x + terrain[0].w < -60) terrain.shift();

  // Physics
  player.vy += GRAVITY;
  player.y += player.vy;

  const midX = player.x + player.w * 0.5;
  const groundUnder = getGroundY(midX);
  const under = getTerrainUnder(midX);

  // ========== SOLID WALL LOGIC ==========
  // Rising platform = smaller Y number
  // When a higher platform slides under the player, kick her off the ground
  // so she falls instead of clipping into the solid body.

  if (player.onGround) {
    if (groundUnder < player.lockedGroundY - 2) {
      // Higher platform under us → solid wall. Kick off ground so we fall.
      player.onGround = false;
      player.vy = 0.5; // tiny downward push so gravity takes over cleanly
      // keep lockedGroundY the same so we don't auto-climb later
    } else {
      // Same height or lower → stay on ground
      player.y = groundUnder;
      player.lockedGroundY = groundUnder;
      player.vy = 0;

      if (under && under.type === 'water' && invuln <= 0) {
        lives--;
        invuln = 50;
        spawnWaterSplash(player.x + 8, player.y - 4);
        sfxWater();
        if (lives <= 0) gameOver();
      }
    }
  } else {
    // In the air - normal landing (only from above)
    if (player.vy >= 0 && player.y >= groundUnder - 1) {
      player.y = groundUnder;
      player.vy = 0;
      player.onGround = true;
      player.lockedGroundY = groundUnder;

      if (under && under.type === 'water' && invuln <= 0) {
        lives--;
        invuln = 50;
        spawnWaterSplash(player.x + 8, player.y - 4);
        sfxWater();
        if (lives <= 0) gameOver();
      }
    }
  }

  if (player.y > GAME_HEIGHT + 40) {
    lives = 0;
    gameOver();
  }

  // Animation
  player.animTimer++;
  if (player.onGround) {
    if (player.animTimer > 6) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 3;
    }
  } else {
    player.animFrame = 3;
  }

  bgFar += speed * 0.12;
  bgMid += speed * 0.35;
  bgNear += speed * 0.9;

  distance += speed * 0.15;
  score = Math.floor(distance) + coins * 15;

  if (frameCount % Math.max(40, 88 - Math.floor(speed * 6)) === 0) spawnObstacle();
  if (frameCount % 70 === 0) spawnCollectible();

  // Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;

    const colliding =
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y - player.h < o.y + o.h &&
      player.y > o.y;

    if (colliding && invuln <= 0) {
      if (o.type === 'bird') {
        const birdMid = o.y + o.h * 0.45;
        if (player.vy > 0 && player.y < birdMid + 8) {
          obstacles.splice(i, 1);
          player.vy = -6.8;
          score += 50;
          spawnStompParticles(o.x + o.w / 2, o.y + 4);
          sfxStomp();
          continue;
        }
      }

      lives--;
      invuln = 55;
      spawnHitParticles(player.x + 8, player.y - 12);
      sfxHit();
      if (lives <= 0) gameOver();
    }

    if (o.x + o.w < -30) obstacles.splice(i, 1);
  }

  // Collectibles
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    c.x -= speed;

    if (!c.collected &&
        player.x < c.x + c.w &&
        player.x + player.w > c.x &&
        player.y - player.h < c.y + c.h &&
        player.y > c.y) {
      c.collected = true;
      if (c.type === 'coin') {
        coins++;
        sfxCoin();
      } else {
        lives = Math.min(5, lives + 1);
        sfxHeart();
      }
      spawnHitParticles(c.x + 6, c.y + 6, '#ffd700', '#ffee88');
    }

    if (c.x + c.w < -15 || c.collected) collectibles.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (invuln > 0) invuln--;
}

// -------------------- DRAW --------------------
function draw() {
  drawWorld();

  obstacles.forEach(drawObstacle);
  collectibles.forEach(drawCollectible);

  particles.forEach(p => {
    px(p.x, p.y, p.size || 3, p.size || 3, p.color);
  });

  if (invuln <= 0 || Math.floor(invuln / 4) % 2 === 0) {
    drawFox(player.x, player.y - 24, player.animFrame, 1);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Courier New';
  ctx.fillText(`SCORE ${score}`, 8, 16);
  ctx.fillText(`COINS ${coins}`, 8, 28);

  for (let i = 0; i < lives; i++) {
    px(GAME_WIDTH - 18 - i * 14, 8, 4, 4, '#ff3366');
    px(GAME_WIDTH - 14 - i * 14, 8, 4, 4, '#ff3366');
    px(GAME_WIDTH - 16 - i * 14, 11, 6, 5, '#ff3366');
  }

  if (state === 'start') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL FOX RUNNER', GAME_WIDTH / 2, 70);

    ctx.fillStyle = '#22cc66';
    ctx.font = '12px Courier New';
    ctx.fillText('featuring Ani', GAME_WIDTH / 2, 92);

    drawFox(GAME_WIDTH / 2 - 24, 110, 0, 3);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Courier New';
    ctx.fillText('SPACE / TAP TO START', GAME_WIDTH / 2, 215);
    ctx.font = '9px Courier New';
    ctx.fillText('Hills • Platforms • Water pits • Stomp birds', GAME_WIDTH / 2, 235);
    ctx.textAlign = 'left';
  }

  if (state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff4466';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Courier New';
    ctx.fillText(`SCORE  ${score}`, GAME_WIDTH / 2, 130);
    ctx.fillText(`COINS  ${coins}`, GAME_WIDTH / 2, 150);

    ctx.font = '11px Courier New';
    ctx.fillText('TAP / SPACE TO RESTART', GAME_WIDTH / 2, 200);
    ctx.textAlign = 'left';
  }
}

// -------------------- LOOP --------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
