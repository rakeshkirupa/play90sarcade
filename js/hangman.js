/**
 * HANGMAN — 90s style. Word guess, 6 wrong max. Session high score (wins), celebration.
 */
(function () {
  'use strict';

  const WORDS = ['ARCADE','SNAKE','TETRIS','NOKIA','GAMEBOY','CASSETTE','NINETIES','PIXEL','JOYSTICK','RETRO','HIGHSCORE','COIN','PLAYER'];
  const BEST_KEY = 'hangmanBest';
  const MAX_WRONG = 6;

  const canvas = document.getElementById('hangmanCanvas');
  const ctx = canvas && canvas.getContext('2d');
  const wordDisplay = document.getElementById('wordDisplay');
  const lettersEl = document.getElementById('letters');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const roundEl = document.getElementById('round');
  const wrongEl = document.getElementById('wrong');
  const overlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverMessage = document.getElementById('gameOverMessage');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const gameOverHint = document.getElementById('gameOverHint');
  const newHighScoreBanner = document.getElementById('newHighScoreBanner');

  let word = '', guessed = [], wrong = 0, wins = 0, round = 0, lastWord = '';

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

  function drawStickman() {
    if (!ctx) return;
    var cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    ctx.scale(cw / 200, ch / 220);
    /* Gallows: arcade neon-blue */
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.moveTo(40, 200); ctx.lineTo(120, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 200); ctx.lineTo(80, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 30); ctx.lineTo(140, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 30); ctx.lineTo(140, 52); ctx.stroke();
    ctx.shadowBlur = 0;
    /* Figure: theme yellow (wrong guesses) */
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(255, 230, 0, 0.5)';
    ctx.shadowBlur = 4;
    if (wrong >= 1) { ctx.beginPath(); ctx.arc(140, 62, 10, 0, Math.PI * 2); ctx.stroke(); }
    if (wrong >= 2) { ctx.beginPath(); ctx.moveTo(140, 72); ctx.lineTo(140, 120); ctx.stroke(); }
    if (wrong >= 3) { ctx.beginPath(); ctx.moveTo(140, 82); ctx.lineTo(118, 100); ctx.stroke(); }
    if (wrong >= 4) { ctx.beginPath(); ctx.moveTo(140, 82); ctx.lineTo(162, 100); ctx.stroke(); }
    if (wrong >= 5) { ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(122, 155); ctx.stroke(); }
    if (wrong >= 6) { ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(158, 155); ctx.stroke(); }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function pickWord() {
    var w;
    do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; }
    while (WORDS.length > 1 && w === lastWord);
    lastWord = w;
    return w;
  }

  function renderWord() {
    var html = word.split('').map(function(c) {
      return guessed.indexOf(c) >= 0 ? '<span class="letter-show">' + c + '</span>' : '<span class="letter-hide">_</span>';
    }).join(' ');
    wordDisplay.innerHTML = html;
  }

  function renderLetters() {
    var abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    lettersEl.innerHTML = abc.split('').map(function(c) {
      var used = guessed.indexOf(c) >= 0;
      return '<button type="button" class="letter-btn' + (used ? ' used' : '') + '" data-letter="' + c + '" data-key="Key' + c + '"' + (used ? ' disabled' : '') + '>' + c + '</button>';
    }).join('');
  }

  function checkWin() {
    return word.split('').every(function(c) { return guessed.indexOf(c) >= 0; });
  }

  function endGame(won) {
    var oldBest = getBest();
    if (won) {
      wins++;
      if (scoreEl) scoreEl.textContent = wins;
      if (wins > oldBest) setBest(wins);
      gameOverTitle.textContent = 'YOU WIN!';
      gameOverMessage.textContent = 'Word: ' + word;
      if (playAgainBtn) playAgainBtn.textContent = 'NEXT ROUND';
      if (playAgainBtn) playAgainBtn.setAttribute('aria-label', 'Next round');
      if (gameOverHint) gameOverHint.textContent = 'SPACE TO CONTINUE';
      if (newHighScoreBanner && wins > oldBest) {
        newHighScoreBanner.classList.remove('hidden');
        if (typeof window.playNewHighScoreCelebration === 'function') window.playNewHighScoreCelebration();
      } else {
        if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
        if (typeof window.playEatSound === 'function') window.playEatSound();
      }
      if (typeof window.speakNextRound === 'function') window.speakNextRound();
    } else {
      if (typeof window.playGameOverSound === 'function') window.playGameOverSound();
      gameOverTitle.textContent = 'GAME OVER';
      gameOverMessage.textContent = 'Word was: ' + word;
      if (playAgainBtn) playAgainBtn.textContent = 'TRY AGAIN';
      if (playAgainBtn) playAgainBtn.setAttribute('aria-label', 'Try again');
      if (gameOverHint) gameOverHint.textContent = 'SPACE TO RESTART';
      if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
    }
    finalScoreEl.textContent = wins;
    finalBestEl.textContent = getBest();
    bestEl.textContent = getBest();
    overlay.classList.remove('hidden');
  }

  function startRound() {
    round++;
    word = pickWord();
    guessed = [];
    wrong = 0;
    if (scoreEl) scoreEl.textContent = wins;
    if (bestEl) bestEl.textContent = getBest();
    if (roundEl) roundEl.textContent = round;
    if (wrongEl) wrongEl.textContent = '0/' + MAX_WRONG;
    if (playAgainBtn) playAgainBtn.textContent = 'NEXT ROUND';
    if (gameOverHint) gameOverHint.textContent = 'SPACE TO CONTINUE';
    drawStickman();
    renderWord();
    renderLetters();
    overlay.classList.add('hidden');
    if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
  }

  lettersEl.addEventListener('click', function(e) {
    var btn = e.target.closest('.letter-btn');
    if (!btn || btn.disabled) return;
    var c = btn.getAttribute('data-letter');
    guessed.push(c);
    btn.classList.add('used');
    btn.disabled = true;
    if (word.indexOf(c) >= 0) {
      if (typeof window.playEatSound === 'function') window.playEatSound();
      renderWord();
      if (checkWin()) setTimeout(function() { endGame(true); }, 300);
    } else {
      wrong++;
      if (typeof window.playButtonSound === 'function') window.playButtonSound();
      if (wrongEl) wrongEl.textContent = wrong + '/' + MAX_WRONG;
      drawStickman();
      if (wrong >= MAX_WRONG) setTimeout(function() { endGame(false); }, 300);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (!overlay.classList.contains('hidden')) {
      if (e.key === ' ') { e.preventDefault(); startRound(); }
      return;
    }
    var c = (e.key || '').toUpperCase();
    if (c.length === 1 && c >= 'A' && c <= 'Z' && guessed.indexOf(c) < 0) {
      var btn = lettersEl.querySelector('[data-letter="' + c + '"]');
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
    }
  });

  playAgainBtn.addEventListener('click', startRound);

  bestEl.textContent = getBest();
  startRound();

  window.__hangmanRestart = startRound;
})();
