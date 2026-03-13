/**
 * FLAPPY BIRD — Arcade flying challenge. Canvas game with neon theme.
 * Gravity, pipes, score, best score (localStorage), game over, restart.
 */
(function () {
  'use strict';

  var BEST_KEY = 'flappyBestScore';
  var CW = 400;
  var CH = 600;
  var GRAVITY = 0.45;
  var FLAP_IMPULSE = -9;
  var PIPE_WIDTH = 60;
  var PIPE_GAP = 180;
  var PIPE_SPEED = 3.5;
  var PIPE_SPAWN_INTERVAL = 90;
  var BIRD_RADIUS = 16;
  var GROUND_Y = CH - 48;
  var SKY_Y = 48;

  var colors = {
    bg: '#0f0f1a',
    bgGrid: 'rgba(0, 212, 255, 0.06)',
    pipe: '#8bac0f',
    pipeGlow: 'rgba(139, 172, 15, 0.6)',
    pipeBorder: '#ffe600',
    bird: '#ffe600',
    birdGlow: 'rgba(255, 230, 0, 0.6)',
    ground: '#1a1a2e',
    score: '#ffe600',
    scoreGlow: 'rgba(255, 230, 0, 0.8)'
  };

  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var overlay = document.getElementById('gameOverOverlay');
  var finalScoreEl = document.getElementById('finalScore');
  var finalBestEl = document.getElementById('finalBest');
  var playAgainBtn = document.getElementById('playAgainBtn');
  var newHighScoreBanner = document.getElementById('newHighScoreBanner');

  var birdY = CH / 2;
  var birdVy = 0;
  var pipes = [];
  var score = 0;
  var frameCount = 0;
  var gameOver = false;
  var gameStarted = false;
  var animId = null;

  function getBest() {
    try {
      var raw = localStorage.getItem(BEST_KEY);
      return raw ? Math.max(0, parseInt(raw, 10)) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setBest(val) {
    try {
      localStorage.setItem(BEST_KEY, String(Math.max(0, val)));
    } catch (e) {}
  }

  function drawGrid() {
    var step = 24;
    ctx.strokeStyle = colors.bgGrid;
    ctx.lineWidth = 1;
    for (var x = 0; x <= CW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CH);
      ctx.stroke();
    }
    for (var y = 0; y <= CH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CW, y);
      ctx.stroke();
    }
  }

  function drawBird() {
    var x = 80;
    var r = BIRD_RADIUS;
    ctx.save();
    ctx.shadowColor = colors.birdGlow;
    ctx.shadowBlur = 12;
    /* Body: oval */
    ctx.fillStyle = colors.bird;
    ctx.beginPath();
    ctx.ellipse(x, birdY, r * 1.1, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ccb800';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Beak: triangle pointing right */
    ctx.fillStyle = '#ff6600';
    ctx.strokeStyle = '#cc5200';
    ctx.beginPath();
    ctx.moveTo(x + r - 2, birdY);
    ctx.lineTo(x + r + 14, birdY - 4);
    ctx.lineTo(x + r + 14, birdY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Eye: white + pupil */
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 4, birdY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f0f1a';
    ctx.beginPath();
    ctx.arc(x + 5, birdY - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    /* Wing: small arc (flap hint) */
    ctx.strokeStyle = '#ccb800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x - 4, birdY + 2, 6, 8, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPipe(pipe) {
    var x = pipe.x;
    var gapY = pipe.gapY;
    var gapH = PIPE_GAP;
    var topH = gapY;
    var bottomY = gapY + gapH;
    var bottomH = CH - bottomY;

    ctx.save();
    ctx.shadowColor = colors.pipeGlow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = colors.pipe;
    ctx.strokeStyle = colors.pipeBorder;
    ctx.lineWidth = 3;

    ctx.fillRect(x, 0, PIPE_WIDTH, topH);
    ctx.strokeRect(x, 0, PIPE_WIDTH, topH);

    ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomH);
    ctx.strokeRect(x, bottomY, PIPE_WIDTH, bottomH);

    ctx.restore();
  }

  function drawGround() {
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, GROUND_Y, CW, CH - GROUND_Y);
    ctx.strokeStyle = colors.pipeBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CW, GROUND_Y);
    ctx.stroke();
  }

  function drawScore() {
    ctx.save();
    ctx.font = '24px "Press Start 2P", cursive';
    ctx.fillStyle = colors.score;
    ctx.shadowColor = colors.scoreGlow;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(String(score), CW / 2, 42);
    ctx.restore();
  }

  function spawnPipe() {
    var minGapY = 120;
    var maxGapY = CH - PIPE_GAP - 120;
    var gapY = minGapY + Math.random() * (maxGapY - minGapY);
    pipes.push({
      x: CW,
      gapY: gapY,
      gapHeight: PIPE_GAP,
      passed: false
    });
  }

  function hitPipe(pipe) {
    var bx = 80;
    var px = pipe.x;
    var gapY = pipe.gapY;
    var gapH = PIPE_GAP;
    if (bx + BIRD_RADIUS < px || bx - BIRD_RADIUS > px + PIPE_WIDTH) return false;
    if (birdY - BIRD_RADIUS > gapY && birdY + BIRD_RADIUS < gapY + gapH) return false;
    return true;
  }

  function gameOverState() {
    gameOver = true;
    if (window.playGameOverSound) window.playGameOverSound();
    var best = getBest();
    if (score > best) {
      setBest(score);
      best = score;
      if (window.playNewHighScoreCelebration) window.playNewHighScoreCelebration();
      if (newHighScoreBanner) {
        newHighScoreBanner.classList.remove('hidden');
      }
    }
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalBestEl) finalBestEl.textContent = best;
    var ov = document.getElementById('gameOverOverlay');
    if (ov) {
      ov.classList.remove('hidden');
      ov.style.display = '';
    }
    var btn = document.getElementById('playAgainBtn');
    if (btn) btn.focus();
  }

  function tick() {
    if (gameOver) {
      animId = requestAnimationFrame(tick);
      return;
    }

    frameCount++;
    if (gameStarted) {
      birdVy += GRAVITY;
      birdY += birdVy;

      if (birdY - BIRD_RADIUS < SKY_Y) {
        birdY = SKY_Y + BIRD_RADIUS;
        birdVy = 0;
      }
      if (birdY + BIRD_RADIUS > GROUND_Y) {
        birdY = GROUND_Y - BIRD_RADIUS;
        gameOverState();
        return;
      }

      if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
        spawnPipe();
      }

      for (var i = pipes.length - 1; i >= 0; i--) {
        var p = pipes[i];
        p.x -= PIPE_SPEED;
        if (p.x + PIPE_WIDTH < 0) {
          pipes.splice(i, 1);
          continue;
        }
        if (!p.passed && p.x + PIPE_WIDTH < 80) {
          p.passed = true;
          score++;
          if (window.playEatSound) window.playEatSound();
        }
        if (hitPipe(p)) {
          gameOverState();
          return;
        }
      }
    }

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, CW, CH);
    drawGrid();
    drawGround();
    pipes.forEach(drawPipe);
    drawBird();
    drawScore();

    if (bestEl) bestEl.textContent = getBest();
    if (scoreEl) scoreEl.textContent = score;

    animId = requestAnimationFrame(tick);
  }

  function flap() {
    if (gameOver) return;
    if (!gameStarted) gameStarted = true;
    birdVy = FLAP_IMPULSE;
    if (window.playButtonSound) window.playButtonSound();
  }

  function restart() {
    var ov = document.getElementById('gameOverOverlay');
    var ban = document.getElementById('newHighScoreBanner');
    if (ban) ban.classList.add('hidden');
    if (ov) {
      ov.classList.add('hidden');
      ov.style.display = 'none';
    }
    birdY = CH / 2;
    birdVy = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameOver = false;
    gameStarted = false;
    if (scoreEl) scoreEl.textContent = '0';
    if (bestEl) bestEl.textContent = getBest();
    if (canvas && canvas.focus) canvas.focus();
    if (animId !== null) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(tick);
  }

  function onKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      if (gameOver) {
        restart();
      } else {
        flap();
      }
    }
  }

  function onClick(e) {
    if (gameOver) return;
    flap();
  }

  document.addEventListener('click', function (e) {
    if (gameOver && e.target && (e.target.id === 'playAgainBtn' || e.target.closest('.game-over-box'))) {
      var btn = e.target.id === 'playAgainBtn' ? e.target : e.target.querySelector('#playAgainBtn') || e.target.closest('button');
      if (btn && (btn.id === 'playAgainBtn' || btn.classList.contains('btn-play-again'))) {
        e.preventDefault();
        e.stopPropagation();
        restart();
      }
    }
  }, true);

  var playAgainBtnEl = document.getElementById('playAgainBtn');
  if (playAgainBtnEl) {
    playAgainBtnEl.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      restart();
    });
    playAgainBtnEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (gameOver) restart();
    });
  }

  document.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    flap();
  }, { passive: false });

  if (bestEl) bestEl.textContent = getBest();
  tick();

  window.__flappyRestart = restart;
})();
