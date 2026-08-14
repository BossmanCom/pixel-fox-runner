// ============================================================
// Pixel Fox Runner - Manual Platformer + Soft Stages
// Pure HTML5 Canvas + vanilla JS
// 8-bit style fox girl (Ani)
// Phase 1: Light gacha character unlocks + coin bank + juice
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
const MOVE_SPEED = 3.2;
const MAX_FALL = 12;

// -------------------- CHARACTERS (light gacha) --------------------
const CHARACTERS = [
  {
    id: 'ani',
    name: 'Ani',
    cost: 0,
    colors: { skin: '#ffccaa', hair: '#22cc66', hairDark: '#118844', onesie: '#ff8800', white: '#ffffff', purple: '#aa44ff', tail: '#cc6622' }
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    cost: 50,
    colors: { skin: '#ffccaa', hair: '#44aaff', hairDark: '#2266cc', onesie: '#3388ff', white: '#ffffff', purple: '#66ccff', tail: '#2266aa' }
  },
  {
    id: 'sakura',
    name: 'Sakura',
    cost: 80,
    colors: { skin: '#ffccbb', hair: '#ff66aa', hairDark: '#cc3388', onesie: '#ff99cc', white: '#ffffff', purple: '#ff44aa', tail: '#ee5599' }
  },
  {
    id: 'ember',
    name: 'Ember',
    cost: 120,
    colors: { skin: '#ffe0c0', hair: '#ffcc33', hairDark: '#cc8800', onesie: '#ff5522', white: '#ffffff', purple: '#ffaa00', tail: '#cc4411' }
  },
  {
    id: 'shadow',
    name: 'Shadow',
    cost: 150,
    colors: { skin: '#e8d0f0', hair: '#8844cc', hairDark: '#552288', onesie: '#331144', white: '#ddddff', purple: '#cc66ff', tail: '#6622aa' }
  }
];

function loadSave() {
  try {
    const raw = localStorage.getItem('pfr_save');
    if (!raw) return { bank: 0, unlocked: ['ani'], selected: 'ani' };
    const data = JSON.parse(raw);
    return {
      bank: data.bank || 0,
      unlocked: data.unlocked && data.unlocked.length ? data.unlocked : ['ani'],
      selected: data.selected || 'ani'
    };
  } catch (e) {
    return { bank: 0, unlocked: ['ani'], selected: 'ani' };
  }
}

function saveData() {
  localStorage.setItem('pfr_save', JSON.stringify({
    bank: bankCoins,
    unlocked: unlockedChars,
    selected: selectedCharId
  }));
}

let save = loadSave();
let bankCoins = save.bank;
let unlockedChars = save.unlocked;
let selectedCharId = save.selected;
if (!unlockedChars.includes('ani')) unlockedChars.push('ani');
if (!CHARACTERS.find(c => c.id === selectedCharId)) selectedCharId = 'ani';

function getSelectedChar() {
  return CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];
}

function getCharColors() {
  return getSelectedChar().colors;
}

let selectIndex = Math.max(0, CHARACTERS.findIndex(c => c.id === selectedCharId));
let floatTexts = [];
let unlockFlash = 0;
let milestoneFlash = 0;

function spawnFloatText(x, y, text, color) {
  floatTexts.push({ x, y, text, color, life: 45, maxLife: 45, vy: -1.2 });
}

function tryUnlockCurrent() {
  const ch = CHARACTERS[selectIndex];
  if (unlockedChars.includes(ch.id)) {
    selectedCharId = ch.id;
    saveData();
    return;
  }
  if (bankCoins >= ch.cost) {
    bankCoins -= ch.cost;
    unlockedChars.push(ch.id);
    selectedCharId = ch.id;
    unlockFlash = 60;
    saveData();
    playBeep(660, 0.1, 'square', 0.1);
    playBeep(990, 0.12, 'square', 0.08);
    playBeep(1320, 0.15, 'square', 0.07);
  } else {
    playBeep(120, 0.15, 'sawtooth', 0.08);
  }
}

let canvasScale = 1;
let cameraX = 0;
