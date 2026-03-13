/**
 * BRICK BREAKER — Classic arcade. Paddle, ball, bricks. Session high score, celebration.
 */
(function () {
  'use strict';

  const W = 480, H = 600;
  const BEST_KEY = 'brickBest';
  const PADDLE_W = 96, PADDLE_H = 14;
  const BALL_R = 10;
  const BRICK_ROWS = 8, BRICK_COLS = 10;
  const BRICK_W = (W - 4) / BRICK_COLS - 2, BRICK_H = 20;

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('gameOverOverlay');
  const retryOverlay = document.getElementById('retryOverlay');
  const retryLivesEl = document.getElementById('retryLives');
  const retryBtn = document.getElementById('retryBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const newHighScoreBanner = document.getElementById('newHighScoreBanner');

  const BASE_SPEED = 5;
  const SPEED_PER_LEVEL = 0.9;

  let paddleX = W / 2 - PADDLE_W / 2, paddleY = H - 36;
  let ballX = W / 2, ballY = H - 58, ballDX = BASE_SPEED, ballDY = -BASE_SPEED;
  let bricks = [];
  let score = 0, lives = 3, level = 1;
  let running = false, anim = null, levelUpUntil = 0;

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

  /* One theme per level: unified palette, shifts each stage */
  var STAGE_PALETTES = [
    { main: '#00d4ff', alt: '#0099bb', name: 'cyan' },      /* 1 */
    { main: '#ffe600', alt: '#ccb800', name: 'gold' },       /* 2 */
    { main: '#ff007f', alt: '#c40060', name: 'pink' },      /* 3 */
    { main: '#6a00ff', alt: '#5200c7', name: 'purple' },    /* 4 */
    { main: '#00ff88', alt: '#00c968', name: 'green' },     /* 5 */
    { main: '#ff6600', alt: '#cc5000', name: 'orange' },    /* 6 */
    { main: '#00d4ff', alt: '#ffe600', name: 'cyan' },      /* 7+ cycle */
  ];

  function getStagePalette() {
    var idx = Math.min(level - 1, STAGE_PALETTES.length - 1);
    return STAGE_PALETTES[idx];
  }

  function initBricks() {
    bricks = [];
    var pal = getStagePalette();
    /* Unified: all bricks use the same stage palette (main/alt by row for slight variety) */
    for (var r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = { alive: true, color: r % 2 === 0 ? pal.main : pal.alt };
      }
    }
  }

  function getBallSpeed() {
    var s = BASE_SPEED + (level - 1) * SPEED_PER_LEVEL;
    return Math.min(s, 14);
  }

  function shadeColor(hex, amt) {
    var num = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amt * 255));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt * 255));
    var b = Math.min(255, Math.max(0, (num & 0xff) + amt * 255));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function drawBrickBlock(x, y, w, h, color) {
    var g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, color);
    g.addColorStop(0.45, color);
    g.addColorStop(1, shadeColor(color, -0.4));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + 1, y + 1, Math.max(2, w - 4), 2);
    ctx.fillRect(x + 1, y + 1, 2, Math.max(2, h - 4));
  }

  function resetBall() {
    ballX = W / 2;
    ballY = H - 58;
    var speed = getBallSpeed();
    ballDX = speed * (Math.random() > 0.5 ? 1 : -1);
    ballDY = -speed;
  }

  function draw() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, W, H);
    bricks.forEach(function(row, r) {
      row.forEach(function(b, c) {
        if (!b.alive) return;
        var x = 2 + c * (BRICK_W + 2), y = 2 + r * (BRICK_H + 2);
        drawBrickBlock(x, y, BRICK_W, BRICK_H, b.color);
      });
    });
    var pal = getStagePalette();
    /* Paddle: arcade — dark body, stage-colored front edge */
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(paddleX, paddleY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = pal.main;
    ctx.fillRect(paddleX, paddleY, PADDLE_W, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(paddleX + 2, paddleY, PADDLE_W - 4, 1);
    /* Ball: neon arcade, stage-colored */
    var bg = ctx.createRadialGradient(ballX - 3, ballY - 3, 0, ballX, ballY, BALL_R);
    bg.addColorStop(0, shadeColor(pal.main, 0.25));
    bg.addColorStop(0.5, pal.main);
    bg.addColorStop(1, pal.alt);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(ballX - 3, ballY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    if (levelUpUntil && Date.now() < levelUpUntil) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pal.main;
      ctx.font = 'bold 28px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEXT ROUND', W / 2, H / 2);
    }
  }

  function update() {
    if (!running) return;
    ballX += ballDX;
    ballY += ballDY;
    if (ballX <= BALL_R || ballX >= W - BALL_R) ballDX *= -1;
    if (ballY <= BALL_R) ballDY *= -1;
    if (ballY >= H - BALL_R) {
      lives--;
      if (livesEl) livesEl.textContent = lives;
      if (lives <= 0) { gameOver(); return; }
      running = false;
      if (retryLivesEl) retryLivesEl.textContent = lives;
      if (retryOverlay) retryOverlay.classList.remove('hidden');
      draw();
      return;
    }
    if (ballY + BALL_R >= paddleY && ballY - BALL_R <= paddleY + PADDLE_H &&
        ballX >= paddleX && ballX <= paddleX + PADDLE_W) {
      var hit = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      var speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
      ballDX = hit * speed * 0.9;
      ballDY = -Math.sqrt(Math.max(0, speed * speed - ballDX * ballDX));
      var minVert = speed * 0.35;
      if (Math.abs(ballDY) < minVert) ballDY = ballDY < 0 ? -minVert : minVert;
      if (typeof window.playButtonSound === 'function') window.playButtonSound();
    }
    for (var r = 0; r < bricks.length; r++) {
      for (var c = 0; c < bricks[r].length; c++) {
        if (!bricks[r][c].alive) continue;
        var bx = 2 + c * (BRICK_W + 2) + BRICK_W/2, by = 2 + r * (BRICK_H + 2) + BRICK_H/2;
        if (Math.abs(ballX - bx) < BRICK_W/2 + BALL_R && Math.abs(ballY - by) < BRICK_H/2 + BALL_R) {
          bricks[r][c].alive = false;
          score += 10;
          ballDY *= -1;
          if (typeof window.playEatSound === 'function') window.playEatSound();
          if (scoreEl) scoreEl.textContent = score;
          var allDead = bricks.every(function(row) { return row.every(function(b) { return !b.alive; }); });
          if (allDead) {
            level++;
            if (levelEl) levelEl.textContent = level;
            if (typeof window.playEatSound === 'function') window.playEatSound();
            if (typeof window.speakNextRound === 'function') window.speakNextRound();
            initBricks();
            resetBall();
            running = false;
            levelUpUntil = Date.now() + 600;
            draw();
            setTimeout(function() { levelUpUntil = 0; running = true; draw(); }, 600);
          }
        }
      }
    }
    draw();
  }

  function retryRound() {
    if (!retryOverlay || retryOverlay.classList.contains('hidden')) return;
    retryOverlay.classList.add('hidden');
    if (typeof window.speakRestart === 'function') window.speakRestart();
    resetBall();
    running = true;
    draw();
    anim = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    if (anim) cancelAnimationFrame(anim);
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
    overlay.classList.remove('hidden');
  }

  function loop() {
    update();
    anim = requestAnimationFrame(loop);
  }

  function startGame() {
    initBricks();
    score = 0;
    lives = 3;
    level = 1;
    paddleX = W / 2 - PADDLE_W / 2;
    if (levelEl) levelEl.textContent = '1';
    resetBall();
    scoreEl.textContent = '0';
    bestEl.textContent = getBest();
    if (livesEl) livesEl.textContent = '3';
    overlay.classList.add('hidden');
    if (retryOverlay) retryOverlay.classList.add('hidden');
    if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
    running = true;
    draw();
    anim = requestAnimationFrame(loop);
  }

  document.addEventListener('keydown', function(e) {
    if (retryOverlay && !retryOverlay.classList.contains('hidden')) {
      if (e.key === ' ') { e.preventDefault(); retryRound(); }
      return;
    }
    if (!overlay.classList.contains('hidden')) {
      if (e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); paddleX = Math.max(0, paddleX - 58); draw(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); paddleX = Math.min(W - PADDLE_W, paddleX + 58); draw(); }
  });

  function setPaddleFromClientX(clientX) {
    if (!running || !canvas) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var scale = canvas.width / rect.width;
    var x = (clientX - rect.left) * scale;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W/2));
  }

  document.addEventListener('mousemove', function(e) {
    setPaddleFromClientX(e.clientX);
  });

  canvas.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    setPaddleFromClientX(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) setPaddleFromClientX(e.touches[0].clientX);
  }, { passive: true });

  playAgainBtn.addEventListener('click', startGame);
  if (retryBtn) retryBtn.addEventListener('click', retryRound);

  var btnLeft = document.getElementById('btnLeft'), btnRight = document.getElementById('btnRight');
  if (btnLeft) btnLeft.addEventListener('click', function() { paddleX = Math.max(0, paddleX - 56); if (window.playButtonSound) window.playButtonSound(); draw(); });
  if (btnRight) btnRight.addEventListener('click', function() { paddleX = Math.min(W - PADDLE_W, paddleX + 56); if (window.playButtonSound) window.playButtonSound(); draw(); });

  bestEl.textContent = getBest();
  startGame();

  window.__brickRestart = startGame;
})();
