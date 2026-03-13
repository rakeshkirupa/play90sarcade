/**
 * Fallback: ensure Space key and any click on overlay restarts when game-over is visible.
 */
(function () {
  'use strict';
  var overlay = document.getElementById('gameOverOverlay');
  var playAgainBtn = document.getElementById('playAgainBtn');
  if (!overlay || !playAgainBtn) return;

  function isVisible() {
    if (!overlay) return false;
    if (overlay.classList.contains('hidden')) return false;
    if (overlay.style.display === 'none') return false;
    return true;
  }

  function doRestart() {
    if (!isVisible()) return;
    if (typeof window.speakRestart === 'function') window.speakRestart();
    if (overlay.closest('.game-container-flappy') && typeof window.__flappyRestart === 'function') {
      window.__flappyRestart();
      return;
    }
    if (overlay.closest('.game-container-hangman') && typeof window.__hangmanRestart === 'function') {
      window.__hangmanRestart();
      return;
    }
    if (overlay.closest('.game-container-memory') && typeof window.__memoryRestart === 'function') {
      window.__memoryRestart();
      return;
    }
    if (overlay.closest('.game-container-tetris') && typeof window.__tetrisRestart === 'function') {
      window.__tetrisRestart();
      return;
    }
    if (overlay.closest('.game-container-snake') && typeof window.__snakeRestart === 'function') {
      window.__snakeRestart();
      return;
    }
    if (overlay.closest('.game-container-brick') && typeof window.__brickRestart === 'function') {
      window.__brickRestart();
      return;
    }
    playAgainBtn.click();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || !isVisible()) return;
    e.preventDefault();
    e.stopPropagation();
    doRestart();
  }, true);

  document.addEventListener('click', function (e) {
    if (!isVisible()) return;
    if (!overlay.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    doRestart();
  }, true);
})();
