/**
 * MEMORY MATCH — 90s card flip. Pairs, move count. Session best (fewest moves), celebration.
 */
(function () {
  'use strict';

  const EMOJIS = ['🐍','🧱','🎮','📼','📺','🕹️','⭐','🌟','🎯','🔶','💾','👾'];
  const BEST_KEY = 'memoryBest';
  /* Pairs per level: 4 → 6 → 8 → 12 (then 12 for level 5+) */
  function getPairsForLevel(lvl) {
    if (lvl <= 1) return 4;
    if (lvl === 2) return 6;
    if (lvl === 3) return 8;
    return 12;
  }

  const gridEl = document.getElementById('memoryGrid');
  const movesEl = document.getElementById('moves');
  const levelEl = document.getElementById('level');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('gameOverOverlay');
  const finalMovesEl = document.getElementById('finalMoves');
  const finalLevelEl = document.getElementById('finalLevel');
  const finalBestEl = document.getElementById('finalBest');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const newHighScoreBanner = document.getElementById('newHighScoreBanner');

  const FLIP_BACK_BASE_MS = 900;
  const FLIP_BACK_PER_LEVEL_MS = 60;
  const FLIP_BACK_MIN_MS = 450;

  let cards = [], flipped = [], moves = 0, matched = 0, level = 1;

  function getBest() {
    var b = (typeof SecureLocalStorage !== 'undefined' && SecureLocalStorage.get(BEST_KEY)) ||
            (typeof SecureSessionStorage !== 'undefined' && SecureSessionStorage.get(BEST_KEY)) || null;
    return b === null || b === '' ? null : parseInt(b, 10);
  }
  function setBest(v) {
    if (typeof SecureLocalStorage !== 'undefined') SecureLocalStorage.set(BEST_KEY, String(v));
    else if (typeof SecureSessionStorage !== 'undefined') SecureSessionStorage.set(BEST_KEY, String(v));
    else try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {}
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function build() {
    if (!gridEl) return;
    var numPairs = getPairsForLevel(level);
    var pairEmojis = EMOJIS.slice(0, numPairs);
    var pairs = pairEmojis.concat(pairEmojis);
    cards = shuffle(pairs.slice()).map(function(val, i) {
      return { id: i, val: val, el: null, flipped: false, matched: false };
    });
    gridEl.innerHTML = '';
    gridEl.className = 'memory-grid' + (numPairs > 8 ? ' memory-grid-large' : '');
    var numCards = cards.length;
    var cols = numCards <= 16 ? 4 : 6;
    gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    cards.forEach(function(c) {
      var div = document.createElement('button');
      div.type = 'button';
      div.className = 'memory-card';
      div.innerHTML = '<span class="back">?</span><span class="front">' + c.val + '</span>';
      div.addEventListener('click', function() { flip(c); });
      c.el = div;
      gridEl.appendChild(div);
    });
  }

  function flip(c) {
    if (c.flipped || c.matched || flipped.length >= 2) return;
    c.flipped = true;
    c.el.classList.add('flipped');
    if (typeof window.playButtonSound === 'function') window.playButtonSound();
    flipped.push(c);
    if (flipped.length === 2) {
      moves++;
      if (movesEl) movesEl.textContent = moves;
      if (flipped[0].val === flipped[1].val) {
        flipped[0].matched = flipped[1].matched = true;
        flipped[0].el.classList.add('matched');
        flipped[1].el.classList.add('matched');
        matched += 2;
        if (typeof window.playEatSound === 'function') window.playEatSound();
        flipped = [];
        if (matched === cards.length) setTimeout(win, 400);
      } else {
        var flipBackMs = Math.max(FLIP_BACK_MIN_MS, FLIP_BACK_BASE_MS - (level - 1) * FLIP_BACK_PER_LEVEL_MS);
        setTimeout(function() {
          flipped[0].flipped = flipped[1].flipped = false;
          flipped[0].el.classList.remove('flipped');
          flipped[1].el.classList.remove('flipped');
          flipped = [];
        }, flipBackMs);
      }
    }
  }

  function win() {
    var best = getBest();
    var isNewBest = best === null || moves < best;
    if (isNewBest) setBest(moves);
    if (finalMovesEl) finalMovesEl.textContent = moves;
    if (finalLevelEl) finalLevelEl.textContent = level;
    if (finalBestEl) finalBestEl.textContent = getBest();
    if (bestEl) bestEl.textContent = getBest();
    if (newHighScoreBanner) {
      if (isNewBest) {
        newHighScoreBanner.classList.remove('hidden');
        if (typeof window.playNewHighScoreCelebration === 'function') window.playNewHighScoreCelebration();
      } else {
        newHighScoreBanner.classList.add('hidden');
      }
    }
    overlay.classList.remove('hidden');
    level++;
    if (levelEl) levelEl.textContent = level;
  }

  function startGame() {
    flipped = [];
    moves = 0;
    matched = 0;
    if (levelEl) levelEl.textContent = level;
    build();
    if (movesEl) movesEl.textContent = '0';
    var b = getBest();
    if (bestEl) bestEl.textContent = b === null ? '—' : b;
    overlay.classList.add('hidden');
    if (newHighScoreBanner) newHighScoreBanner.classList.add('hidden');
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === ' ' && !overlay.classList.contains('hidden')) {
      e.preventDefault();
      startGame();
    }
  });

  playAgainBtn.addEventListener('click', startGame);

  var initialBest = getBest();
  bestEl.textContent = initialBest === null ? '—' : initialBest;
  startGame();

  window.__memoryRestart = startGame;
})();
