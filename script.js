// ============================================================
// Pixel Fox Runner - Infinite Runner
// Pure HTML5 Canvas + vanilla JS
// 8-bit style fox girl (Ani) as the player
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Disable smoothing so pixels stay chunky
ctx.imageSmoothingEnabled = false;

// -------------------- CONFIG --------------------
const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;          // 16:9-ish retro feel
const GROUND_Y = 220;
const GRAVITY = 0.55;
const JUMP_FORCE = -9.8;
const START_SPEED = 2.8;
const MAX_SPEED = 9.5;
const SPEED_INCREASE = 0.00035;

let canvasScale = 1;

// -------------------- STATE --------------------
let state = 'start';             // 'start' | 'playing' | 'gameover'
let score = 0;
let distance = 0;
let coins = 0;
let lives = 3;
let invuln = 0;                  // invulnerability frames after hit
let speed = START_SPEED;
let frameCount = 0;

// -------------------- PLAYER --------------------
const player = {
  x: 70,
  y: GROUND_Y,                   // y = feet / bottom of sprite
  w: 16,
  h: 24,
  vy: 0,
  onGround: true,
  animFrame: 0,
  animTimer: 0
};

// -------------------- WORLD OBJECTS --------------------
let obstacles = [];
let collectibles = [];
let particles = [];

// Parallax layers
let bgFar = 0;
let bgMid = 0;
let bgNear = 0;

// -------------------- INPUT --------------------
function onJump() {
  if (state === 'start') {
    startGame();
    return;
  }
  if (state === 'gameover') {
    restartGame();
    return;
  }
  if (state === 'playing' && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
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

// -------------------- SPRITE DRAWING (pure pixel art) --------------------
const C = {
  skin: '#ffccaa',
  hair: '#22cc66',
  hairDark: '#118844',
  onesie: '#ff8800',
  onesieDark: '#cc5500',
  white: '#ffffff',
  purple: '#aa44ff',
  black: '#1a1a1a',
  outline: '#000000',
  tail: '#cc6622'
};

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

// Main character drawer – 16×24 pixel fox girl
// pxY is the TOP of the sprite
function drawFox(pxX, pxY, frame, scale = 1) {
  const s = scale;
  const x = Math.floor(pxX);
  const y = Math.floor(pxY);

  // Tail (behind)
  px(x - 4*s, y + 12*s, 6*s, 4*s, C.tail);
  px(x - 6*s, y + 10*s, 4*s, 4*s, C.tail);

  // Body / onesie
  px(x + 3*s, y + 10*s, 10*s, 10*s, C.onesie);
  px(x + 2*s, y + 11*s, 12*s, 8*s, C.onesie);
  // Hood
  px(x + 2*s, y + 4*s, 12*s, 8*s, C.onesie);
  px(x + 1*s, y + 5*s, 14*s, 6*s, C.onesie);

  // Ears (hood ears)
  px(x + 2*s, y + 1*s, 4*s, 5*s, C.onesie);
  px(x + 10*s, y + 1*s, 4*s, 5*s, C.onesie);
  px(x + 3*s, y + 2*s, 2*s, 3*s, C.white);
  px(x + 11*s, y + 2*s, 2*s, 3*s, C.white);

  // Face
  px(x + 4*s, y + 6*s, 8*s, 6*s, C.skin);

  // Hair (twintails)
  px(x + 1*s, y + 5*s, 3*s, 8*s, C.hair);
  px(x + 12*s, y + 5*s, 3*s, 8*s, C.hair);
  px(x + 0*s, y + 7*s, 2*s, 6*s, C.hairDark);
  px(x + 14*s, y + 7*s, 2*s, 6*s, C.hairDark);

  // Eyes
  px(x + 5*s, y + 7*s, 2*s, 2*s, C.purple);
  px(x + 9*s, y + 7*s, 2*s, 2*s, C.purple);
  px(x + 5*s, y + 7*s, 1*s, 1*s, C.white);
  px(x + 9*s, y + 7*s, 1*s, 1*s, C.white);

  // Legs – different per frame
  if (frame === 0) { // idle
    px(x + 4*s, y + 20*s, 3*s, 4*s, C.onesie);
    px(x + 9*s, y + 20*s, 3*s, 4*s, C.onesie);
  } else if (frame === 1) { // run 1
    px(x + 3*s, y + 19*s, 3*s, 5*s, C.onesie);
    px(x + 10*s, y + 20*s, 3*s, 4*s, C.onesie);
  } else if (frame === 2) { // run 2
    px(x + 4*s, y + 20*s, 3*s, 4*s, C.onesie);
    px(x + 9*s, y + 19*s, 3*s, 5*s, C.onesie);
  } else { // jump
    px(x + 3*s, y + 18*s, 4*s, 4*s, C.onesie);
    px(x + 9*s, y + 18*s, 4*s, 4*s, C.onesie);
  }

  // Little socks
  px(x + 4*s, y + 23*s, 3*s, 1*s, C.white);
  px(x + 9*s, y + 23*s, 3*s, 1*s, C.white);
}

// -------------------- BACKGROUND --------------------
function drawBackground() {
  // Sky
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

  // Far mountains / hills (very slow)
  ctx.fillStyle = '#16213e';
  for (let i = -1; i < 6; i++) {
    const bx = ((i * 120) - (bgFar % 120));
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.lineTo(bx + 40, GROUND_Y - 45);
    ctx.lineTo(bx + 80, GROUND_Y - 25);
    ctx.lineTo(bx + 120, GROUND_Y);
    ctx.fill();
  }

  // Mid trees (medium speed)
  for (let i = -1; i < 8; i++) {
    const tx = ((i * 70) - (bgMid % 70));
    // trunk
    px(tx + 12, GROUND_Y - 30, 6, 30, '#3d2914');
    // leaves
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y - 28);
    ctx.lineTo(tx + 15, GROUND_Y - 55);
    ctx.lineTo(tx + 30, GROUND_Y - 28);
    ctx.fill();
  }

  // Ground
  ctx.fillStyle = '#2d1b0e';
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

  // Near grass / dirt tiles (fast)
  ctx.fillStyle = '#40916c';
  for (let i = -1; i < 20; i++) {
    const gx = ((i * 32) - (bgNear % 32));
    px(gx, GROUND_Y, 30, 4, '#40916c');
    px(gx + 4, GROUND_Y + 4, 8, 3, '#2d6a4f');
  }
}

// -------------------- OBSTACLES & COLLECTIBLES --------------------
function spawnObstacle() {
  const type = Math.random();
  let o;

  if (type < 0.45) {
    // Crate
    o = { type: 'crate', x: GAME_WIDTH + 20, y: GROUND_Y - 20, w: 20, h: 20 };
  } else if (type < 0.75) {
    // Spikes
    o = { type: 'spikes', x: GAME_WIDTH + 20, y: GROUND_Y - 12, w: 24, h: 12 };
  } else {
    // Bird
    o = { type: 'bird', x: GAME_WIDTH + 20, y: GROUND_Y - 50 - Math.random() * 40, w: 18, h: 12, bob: 0 };
  }
  obstacles.push(o);
}

function spawnCollectible() {
  const type = Math.random() < 0.75 ? 'coin' : 'heart';
  collectibles.push({
    type,
    x: GAME_WIDTH + 20,
    y: GROUND_Y - 30 - Math.random() * 60,
    w: 12,
    h: 12,
    collected: false
  });
}

function drawObstacle(o) {
  if (o.type === 'crate') {
    px(o.x, o.y, o.w, o.h, '#8B4513');
    px(o.x + 2, o.y + 2, o.w - 4, o.h - 4, '#A0522D');
    // X mark
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
    // simple pixel bird
    px(o.x, by + 4, 14, 6, '#222');
    px(o.x + 10, by + 2, 6, 4, '#222');
    px(o.x + 2, by + 2, 4, 2, '#fff'); // eye
    // wing
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
    // heart
    ctx.fillStyle = '#ff3366';
    px(c.x + 1, c.y + 3, 4, 4, '#ff3366');
    px(c.x + 7, c.y + 3, 4, 4, '#ff3366');
    px(c.x + 3, c.y + 5, 6, 6, '#ff3366');
  }
}

// -------------------- PARTICLES (tiny juice) --------------------
function spawnHitParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 20 + Math.random() * 10,
      color: Math.random() > 0.5 ? '#ff8800' : '#22cc66'
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
  player.y = GROUND_Y;
  player.vy = 0;
  player.onGround = true;
  invuln = 0;
}

function restartGame() {
  startGame();
}

function gameOver() {
  state = 'gameover';
}

// -------------------- UPDATE --------------------
function update() {
  frameCount++;

  if (state !== 'playing') return;

  // Speed ramp
  speed = Math.min(MAX_SPEED, START_SPEED + distance * SPEED_INCREASE);

  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Animation
  player.animTimer++;
  if (player.onGround) {
    if (player.animTimer > 6) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 3; // 0,1,2 run cycle
    }
  } else {
    player.animFrame = 3; // jump frame
  }

  // Scroll backgrounds
  bgFar += speed * 0.15;
  bgMid += speed * 0.4;
  bgNear += speed * 1.0;

  // Distance & score
  distance += speed * 0.15;
  score = Math.floor(distance) + coins * 15;

  // Spawn logic
  if (frameCount % Math.max(40, 90 - Math.floor(speed * 6)) === 0) {
    spawnObstacle();
  }
  if (frameCount % 70 === 0) {
    spawnCollectible();
  }

  // Move & clean obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;

    // Collision  (player.y is the BOTTOM / feet of the hitbox)
    if (invuln <= 0 &&
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y - player.h < o.y + o.h &&   // player's top < obstacle bottom
        player.y > o.y) {                    // player's bottom > obstacle top
      lives--;
      invuln = 60;
      spawnHitParticles(player.x + 8, player.y - 12);
      if (lives <= 0) gameOver();
    }

    if (o.x + o.w < -20) obstacles.splice(i, 1);
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
      } else {
        lives = Math.min(5, lives + 1);
      }
      spawnHitParticles(c.x + 6, c.y + 6);
    }

    if (c.x + c.w < -10 || c.collected) collectibles.splice(i, 1);
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (invuln > 0) invuln--;
}

// -------------------- DRAW --------------------
function draw() {
  // Clear
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawBackground();

  // Objects
  obstacles.forEach(drawObstacle);
  collectibles.forEach(drawCollectible);

  // Particles
  particles.forEach(p => {
    px(p.x, p.y, 3, 3, p.color);
  });

  // Player (blink when invulnerable)
  // player.y is feet, so draw top at player.y - h
  if (invuln <= 0 || Math.floor(invuln / 4) % 2 === 0) {
    drawFox(player.x, player.y - 24, player.animFrame, 1);
  }

  // UI
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Courier New';
  ctx.fillText(`SCORE ${score}`, 8, 16);
  ctx.fillText(`COINS ${coins}`, 8, 28);

  // Lives as little hearts
  for (let i = 0; i < lives; i++) {
    px(GAME_WIDTH - 18 - i * 14, 8, 4, 4, '#ff3366');
    px(GAME_WIDTH - 14 - i * 14, 8, 4, 4, '#ff3366');
    px(GAME_WIDTH - 16 - i * 14, 11, 6, 5, '#ff3366');
  }

  // Screens
  if (state === 'start') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL FOX RUNNER', GAME_WIDTH / 2, 70);

    ctx.fillStyle = '#22cc66';
    ctx.font = '12px Courier New';
    ctx.fillText('featuring Ani', GAME_WIDTH / 2, 92);

    // Big idle fox
    drawFox(GAME_WIDTH / 2 - 24, 110, 0, 3);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Courier New';
    ctx.fillText('SPACE / TAP TO START', GAME_WIDTH / 2, 220);
    ctx.font = '9px Courier New';
    ctx.fillText('Jump over crates & spikes  •  Collect coins & hearts', GAME_WIDTH / 2, 240);
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
