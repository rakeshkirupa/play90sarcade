/**
 * SNAKE — New high score + celebration only at game over.
 */
(function () {
  'use strict';

  /* Larger grid = more play space like original arcade */
  const GRID_SIZE = 24;
  const CELL_SIZE = 22;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
  const TICK_MS_BASE = 140;
  const TICK_MS_MIN = 85;
  const POINTS_PER_LEVEL = 50;
  const BEST_KEY = 'snakeBest';

  /* Arcade cabinet: dark playfield, neon grid & snake */
  const ARCADE_BG = '#0a0a12';
  const ARCADE_GRID = 'rgba(0, 212, 255, 0.12)';
  const ARCADE_BEZEL = '#ffe600';
  const SNAKE_FILL = '#00d4ff';
  const SNAKE_EDGE = 'rgba(255, 255, 255, 0.5)';
  const SNAKE_HEAD_GLOW = '#00d4ff';
  const FOOD_COLOR = '#ff007f';
  const FOOD_GLOW = '#ff4488';
  const WILDCARD_COLOR = '#6a00ff';
  const WILDCARD_HIGHLIGHT = '#9d4dff';
  const WILDCARD_LIFESPAN_TICKS = 28;  /* ~4 sec at 140ms */
  const WILDCARD_SPAWN_CHANCE = 0.012; /* per tick */
  const MIN_SNAKE_LENGTH = 3;
  const SHRINK_BY = 2;
  const MIN_SNAKE_LENGTH_FOR_WILDCARD = 8;  /* purple only when snake is already long */
  const MIN_SCORE_FOR_WILDCARD = 40;         /* and after some play time (4+ food) */

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const newHighScoreBanner = document.getElementById('newHighScoreBanner');

  let snake = [];
  let food = { x: 0, y: 0 };
  let wildcard = null;  /* { x, y, ticksLeft } */
  let dx = 1;
  let dy = 0;
  let score = 0;
  let best = 0;
  let level = 1;
  let gameLoop = null;
  let nextDir = { dx: 1, dy: 0 };
  let tickCount = 0;
  let currentTickMs = TICK_MS_BASE;

  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');

  function getSessionBest() {
    var raw = (typeof SecureLocalStorage !== 'undefined' && SecureLocalStorage.get(BEST_KEY)) ||
              (typeof SecureSessionStorage !== 'undefined' && SecureSessionStorage.get(BEST_KEY)) || '0';
    return parseInt(raw, 10) || 0;
  }

  function setSessionBest(value) {
    best = value;
    if (typeof SecureLocalStorage !== 'undefined') SecureLocalStorage.set(BEST_KEY, String(value));
    else if (typeof SecureSessionStorage !== 'undefined') SecureSessionStorage.set(BEST_KEY, String(value));
    else try { localStorage.setItem(BEST_KEY, String(value)); } catch (e) {}
  }

  function placeFood() {
    var x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (snake.some(function (s) { return s.x === x && s.y === y; }) || (wildcard && wildcard.x === x && wildcard.y === y));
    food.x = x;
    food.y = y;
  }

  function isEmptyCell(x, y) {
    if (x === food.x && y === food.y) return false;
    if (wildcard && wildcard.x === x && wildcard.y === y) return false;
    return !snake.some(function (s) { return s.x === x && s.y === y; });
  }

  function trySpawnWildcard() {
    if (wildcard) return;
    if (snake.length < MIN_SNAKE_LENGTH_FOR_WILDCARD || score < MIN_SCORE_FOR_WILDCARD) return;
    if (Math.random() > WILDCARD_SPAWN_CHANCE) return;
    var x = Math.floor(Math.random() * GRID_SIZE);
    var y = Math.floor(Math.random() * GRID_SIZE);
    if (!isEmptyCell(x, y)) return;
    wildcard = { x: x, y: y, ticksLeft: WILDCARD_LIFESPAN_TICKS };
  }

  function updateWildcard() {
    if (!wildcard) return;
    wildcard.ticksLeft--;
    if (wildcard.ticksLeft <= 0) wildcard = null;
  }

  function drawGrid() {
    ctx.fillStyle = ARCADE_BG;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = ARCADE_GRID;
    ctx.lineWidth = 1;
    for (var i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
    /* Arcade bezel: neon frame */
    ctx.strokeStyle = ARCADE_BEZEL;
    ctx.lineWidth = 5;
    ctx.shadowColor = ARCADE_BEZEL;
    ctx.shadowBlur = 8;
    ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  function drawSnake() {
    var head = snake[0];
    for (var i = 0; i < snake.length; i++) {
      var seg = snake[i];
      var x = seg.x * CELL_SIZE;
      var y = seg.y * CELL_SIZE;
      var w = CELL_SIZE - 1;
      var h = CELL_SIZE - 1;
      var isHead = i === 0;

      if (isHead) ctx.shadowColor = SNAKE_HEAD_GLOW;
      ctx.shadowBlur = isHead ? 10 : 0;
      ctx.fillStyle = SNAKE_FILL;
      ctx.fillRect(x + 1, y + 1, w - 1, h - 1);
      ctx.fillStyle = SNAKE_EDGE;
      ctx.fillRect(x + 1, y + 1, w - 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, h - 2);
      ctx.shadowBlur = 0;

      if (isHead) {
        var ex, ey;
        if (dx === 1) { ex = x + CELL_SIZE - 6; ey = y + 7; }
        else if (dx === -1) { ex = x + 5; ey = y + 7; }
        else if (dy === 1) { ex = x + CELL_SIZE - 7; ey = y + CELL_SIZE - 6; }
        else { ex = x + 7; ey = y + 5; }
        ctx.fillStyle = SNAKE_EDGE;
        ctx.fillRect(ex, ey, 2, 2);
      }
    }
  }

  function drawFood() {
    var x = food.x * CELL_SIZE + 2;
    var y = food.y * CELL_SIZE + 2;
    var s = CELL_SIZE - 4;
    ctx.shadowColor = FOOD_GLOW;
    ctx.shadowBlur = 6;
    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(x, y, s, s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = FOOD_GLOW;
    ctx.fillRect(x + 1, y + 1, Math.max(2, s - 4), Math.max(2, s - 4));
  }

  function drawWildcard() {
    if (!wildcard) return;
    var x = wildcard.x * CELL_SIZE + 2;
    var y = wildcard.y * CELL_SIZE + 2;
    var s = CELL_SIZE - 4;
    var blink = Math.floor(wildcard.ticksLeft / 4) % 2 === 0;
    ctx.shadowColor = WILDCARD_HIGHLIGHT;
    ctx.shadowBlur = blink ? 8 : 4;
    ctx.fillStyle = blink ? WILDCARD_HIGHLIGHT : WILDCARD_COLOR;
    ctx.fillRect(x, y, s, s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = blink ? WILDCARD_COLOR : WILDCARD_HIGHLIGHT;
    ctx.fillRect(x + 2, y + 2, Math.max(2, s - 4), Math.max(2, s - 4));
  }

  function draw() {
    drawGrid();
    drawSnake();
    drawFood();
    drawWildcard();
  }

  function setDirection(ndx, ndy) {
    if (gameLoop === null) return;
    if (ndx === -dx && ndy === -dy) return;
    nextDir = { dx: ndx, dy: ndy };
  }

  function tick() {
    dx = nextDir.dx;
    dy = nextDir.dy;

    var head = snake[0];
    var nx = head.x + dx;
    var ny = head.y + dy;

    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
      gameOver();
      return;
    }
    if (snake.some(function (s) { return s.x === nx && s.y === ny; })) {
      gameOver();
      return;
    }

    snake.unshift({ x: nx, y: ny });

    if (nx === food.x && ny === food.y) {
      score += 10;
      if (typeof window.playEatSound === 'function') window.playEatSound();
      placeFood();
      scoreEl.textContent = score;
      var newLevel = Math.floor(score / POINTS_PER_LEVEL) + 1;
      if (newLevel > level) {
        level = newLevel;
        if (levelEl) levelEl.textContent = level;
        currentTickMs = Math.max(TICK_MS_MIN, TICK_MS_BASE - (level - 1) * 6);
        if (gameLoop) {
          clearInterval(gameLoop);
          gameLoop = setInterval(tick, currentTickMs);
        }
      }
    } else if (wildcard && nx === wildcard.x && ny === wildcard.y) {
      wildcard = null;
      if (typeof window.playButtonSound === 'function') window.playButtonSound();
      for (var i = 0; i < SHRINK_BY && snake.length > MIN_SNAKE_LENGTH; i++) snake.pop();
    } else {
      snake.pop();
    }

    trySpawnWildcard();
    updateWildcard();
    tickCount++;
    draw();
  }

  function gameOver() {
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = null;
    }
    var oldBest = getSessionBest();
    var isNewHigh = score > oldBest;
    if (isNewHigh) {
      setSessionBest(score);
    }
    finalScoreEl.textContent = score;
    finalBestEl.textContent = getSessionBest();
    bestEl.textContent = getSessionBest();

    if (newHighScoreBanner) {
      if (isNewHigh) {
        newHighScoreBanner.classList.remove('hidden');
        if (typeof window.playNewHighScoreCelebration === 'function') {
          window.playNewHighScoreCelebration();
        }
      } else {
        newHighScoreBanner.classList.add('hidden');
      }
    }
    if (!isNewHigh && typeof window.playGameOverSound === 'function') {
      window.playGameOverSound();
    }

    if (overlay) overlay.classList.remove('hidden');
  }

  function startGame() {
    var cy = Math.floor(GRID_SIZE / 2);
    snake = [
      { x: 5, y: cy },
      { x: 4, y: cy },
      { x: 3, y: cy }
    ];
    nextDir = { dx: 1, dy: 0 };
    dx = 1;
    dy = 0;
    score = 0;
    scoreEl.textContent = '0';
    best = getSessionBest();
    bestEl.textContent = best;
    if (overlay) overlay.classList.add('hidden');
    if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
    wildcard = null;
    tickCount = 0;
    level = 1;
    currentTickMs = TICK_MS_BASE;
    if (levelEl) levelEl.textContent = '1';
    placeFood();
    draw();
    gameLoop = setInterval(tick, currentTickMs);
  }

  function handleKey(e) {
    var gameOverVisible = !overlay.classList.contains('hidden');
    if (e.key === ' ') {
      e.preventDefault();
      if (gameOverVisible) startGame();
      return;
    }
    if (gameOverVisible) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); setDirection(0, -1); if (typeof window.playButtonSound === 'function') window.playButtonSound(); animatePad(btnUp); break;
      case 'ArrowDown': e.preventDefault(); setDirection(0, 1); if (typeof window.playButtonSound === 'function') window.playButtonSound(); animatePad(btnDown); break;
      case 'ArrowLeft': e.preventDefault(); setDirection(-1, 0); if (typeof window.playButtonSound === 'function') window.playButtonSound(); animatePad(btnLeft); break;
      case 'ArrowRight': e.preventDefault(); setDirection(1, 0); if (typeof window.playButtonSound === 'function') window.playButtonSound(); animatePad(btnRight); break;
    }
  }

  function animatePad(btn) {
    if (!btn) return;
    btn.classList.add('pressed');
    if (typeof window.playButtonSound === 'function') window.playButtonSound();
    setTimeout(function () { btn.classList.remove('pressed'); }, 100);
  }

  playAgainBtn.addEventListener('click', startGame);
  document.addEventListener('keydown', handleKey);

  if (btnUp) btnUp.addEventListener('click', function () { setDirection(0, -1); animatePad(btnUp); });
  if (btnDown) btnDown.addEventListener('click', function () { setDirection(0, 1); animatePad(btnDown); });
  if (btnLeft) btnLeft.addEventListener('click', function () { setDirection(-1, 0); animatePad(btnLeft); });
  if (btnRight) btnRight.addEventListener('click', function () { setDirection(1, 0); animatePad(btnRight); });

  bestEl.textContent = getSessionBest();
  startGame();

  window.__snakeRestart = startGame;
})();
