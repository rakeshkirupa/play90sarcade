/**
 * TETRIS — Classic 90s arcade logic. Session high score, celebration at game over.
 */
(function () {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const CELL = 36;
  const W = COLS * CELL;
  const H = ROWS * CELL;
  const FRAME = 10; /* unplayable border (like Flappy ground/sky) */
  const BEST_KEY = 'tetrisBest';
  const FRAME_COLOR = '#1a1a2a';   /* unplayable area */
  const PLAY_BG = '#0a0a12';      /* play area */

  const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
  ];
  const COLORS = ['#00d4ff','#ffe600','#ff007f','#6a00ff','#00ff88','#ff6600','#00d4ff'];

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  /* Force canvas buffer size so drawing is reliable on all loads */
  canvas.width = W;
  canvas.height = H;
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const overlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const newHighScoreBanner = document.getElementById('newHighScoreBanner');

  let grid = [];
  let piece = null;
  let nextPiece = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameLoop = null;
  let dropInterval = 1000;

  function getBest() {
    var raw = (typeof SecureLocalStorage !== 'undefined' && SecureLocalStorage.get(BEST_KEY)) ||
              (typeof SecureSessionStorage !== 'undefined' && SecureSessionStorage.get(BEST_KEY)) || '0';
    return parseInt(raw, 10) || 0;
  }
  function setBest(v) {
    if (typeof SecureLocalStorage !== 'undefined') SecureLocalStorage.set(BEST_KEY, String(v));
    else if (typeof SecureSessionStorage !== 'undefined') SecureSessionStorage.set(BEST_KEY, String(v));
    else try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {}
  }

  function initGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) grid[r][c] = 0;
    }
  }

  function randomPiece() {
    var i = Math.floor(Math.random() * SHAPES.length);
    var s = SHAPES[i].map(function(row) { return row.slice(); });
    return { shape: s, color: COLORS[i], x: Math.floor((COLS - s[0].length) / 2), y: 0 };
  }

  function spawn() {
    piece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    if (collides(piece)) {
      gameOver();
      return;
    }
  }

  function collides(p) {
    for (var r = 0; r < p.shape.length; r++) {
      for (var c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        var nx = p.x + c, ny = p.y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && grid[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    for (var r = 0; r < piece.shape.length; r++) {
      for (var c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        var ny = piece.y + r, nx = piece.x + c;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS)
          grid[ny][nx] = piece.color;
      }
    }
  }

  function clearLines() {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(function(c) { return c; })) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      if (typeof window.playLineClearSound === 'function') window.playLineClearSound();
      /* Nintendo (Game Boy) scoring: 40/100/300/1200 × (level) for 1/2/3/4 lines */
      var base = [0, 40, 100, 300, 1200];
      score += (base[cleared] || 1200) * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 80);
      if (levelEl) levelEl.textContent = level;
      resetInterval();
    }
    if (scoreEl) scoreEl.textContent = score;
  }

  function tick() {
    if (!piece) return;
    piece.y++;
    if (collides(piece)) {
      piece.y--;
      merge();
      clearLines();
      piece = null;
      spawn();
    }
    draw();
  }

  function move(dx) {
    if (!piece) return;
    piece.x += dx;
    if (collides(piece)) piece.x -= dx;
    else if (typeof window.playButtonSound === 'function') window.playButtonSound();
    draw();
  }

  function rotate() {
    if (!piece) return;
    var prev = piece.shape.map(function(r) { return r.slice(); });
    piece.shape = piece.shape[0].map(function(_, i) {
      return piece.shape.map(function(row) { return row[i]; }).reverse();
    });
    if (collides(piece)) piece.shape = prev;
    else if (typeof window.playButtonSound === 'function') window.playButtonSound();
    draw();
  }

  function drop() {
    if (!piece) return;
    var startY = piece.y;
    while (!collides(piece)) piece.y++;
    piece.y--;
    score += (piece.y - startY) * 2 * level;
    if (scoreEl) scoreEl.textContent = score;
    merge();
    clearLines();
    piece = null;
    spawn();
    draw();
  }

  function drawBlock(x, y, color) {
    var s = CELL - 2;
    var px = x + 1, py = y + 1;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px, py, s, 2);
    ctx.fillRect(px, py, 2, s);
  }
  function draw() {
    var cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = FRAME_COLOR;
    ctx.fillRect(0, 0, cw, ch);
    var scale = Math.min((cw - 2 * FRAME) / W, (ch - 2 * FRAME) / H);
    var drawW = W * scale, drawH = H * scale;
    var offsetX = (cw - drawW) / 2, offsetY = (ch - drawH) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.fillStyle = PLAY_BG;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c]) drawBlock(c * CELL, r * CELL, grid[r][c]);
      }
    }
    if (piece) {
      for (var r = 0; r < piece.shape.length; r++) {
        for (var c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            var x = (piece.x + c) * CELL, y = (piece.y + r) * CELL;
            if (y >= 0) drawBlock(x, y, piece.color);
          }
        }
      }
    }
    ctx.restore();
  }

  function gameOver() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
    var oldBest = getBest();
    if (score > oldBest) setBest(score);
    finalScoreEl.textContent = score;
    finalBestEl.textContent = getBest();
    bestEl.textContent = getBest();
    if (newHighScoreBanner) {
      if (score > oldBest) {
        newHighScoreBanner.classList.remove('hidden');
        if (typeof window.playNewHighScoreCelebration === 'function') window.playNewHighScoreCelebration();
      } else {
        newHighScoreBanner.classList.add('hidden');
      }
    }
    if (score <= oldBest && typeof window.playGameOverSound === 'function') window.playGameOverSound();
    if (overlay) overlay.classList.remove('hidden');
  }

  function startGame() {
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = null;
    }
    initGrid();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    nextPiece = null;
    piece = null;
    if (scoreEl) scoreEl.textContent = '0';
    if (bestEl) bestEl.textContent = getBest();
    if (levelEl) levelEl.textContent = '1';
    if (overlay) overlay.classList.add('hidden');
    if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
    spawn();
    if (!piece) return;
    if (overlay && !overlay.classList.contains('hidden')) return;
    draw();
    gameLoop = setInterval(tick, dropInterval);
  }

  function resetInterval() {
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, dropInterval);
    }
  }

  document.addEventListener('keydown', function(e) {
    if (overlay && !overlay.classList.contains('hidden')) {
      if (e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); move(-1); break;
      case 'ArrowRight': e.preventDefault(); move(1); break;
      case 'ArrowDown': e.preventDefault(); if (piece) { score += level; if (scoreEl) scoreEl.textContent = score; } tick(); resetInterval(); break;
      case 'ArrowUp': e.preventDefault(); rotate(); break;
      case ' ': e.preventDefault(); drop(); resetInterval(); break;
    }
  });

  if (playAgainBtn) playAgainBtn.addEventListener('click', startGame);

  var btnLeft = document.getElementById('btnLeft');
  var btnRight = document.getElementById('btnRight');
  var btnRotate = document.getElementById('btnRotate');
  var btnDown = document.getElementById('btnDown');
  if (btnLeft) btnLeft.addEventListener('click', function() { move(-1); if (window.playButtonSound) window.playButtonSound(); });
  if (btnRight) btnRight.addEventListener('click', function() { move(1); if (window.playButtonSound) window.playButtonSound(); });
  if (btnRotate) btnRotate.addEventListener('click', function() { rotate(); });
  if (btnDown) btnDown.addEventListener('click', function() { if (piece) { score += level; if (scoreEl) scoreEl.textContent = score; } tick(); resetInterval(); });

  if (bestEl) bestEl.textContent = getBest();
  window.__tetrisRestart = startGame;

  /* Mobile: swipe on game canvas = move / rotate / soft drop */
  var touchStart = null;
  if (canvas) {
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      if (overlay && !overlay.classList.contains('hidden')) return;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener('touchend', function (e) {
      if (!touchStart || e.changedTouches.length !== 1) return;
      if (overlay && !overlay.classList.contains('hidden')) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      touchStart = null;
      var min = 40;
      if (Math.abs(dx) >= min || Math.abs(dy) >= min) {
        e.preventDefault();
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) move(1);
          else move(-1);
        } else {
          if (dy < 0) rotate();
          else { if (piece) { score += level; if (scoreEl) scoreEl.textContent = score; } tick(); resetInterval(); }
        }
      }
    }, { passive: false });
  }

  /* Start after canvas is laid out so pieces render reliably */
  function init() {
    startGame();
    if (piece) requestAnimationFrame(function() { draw(); });
  }
  if (document.readyState === 'complete') {
    requestAnimationFrame(init);
  } else {
    window.addEventListener('load', function() { requestAnimationFrame(init); });
  }
})();
