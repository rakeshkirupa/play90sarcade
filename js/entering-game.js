/**
 * On game page: play "start game" sound + voice (old arcade style)
 */
(function () {
  'use strict';
  var body = document.body;
  var gameName = body && body.getAttribute('data-game');
  if (!gameName) return;

  var played = false;
  function playOnce() {
    if (played) return;
    played = true;
    if (typeof window.playEnteringGameSound === 'function') {
      window.playEnteringGameSound();
    }
    if (typeof window.speakGameName === 'function') {
      window.speakGameName(gameName);
    }
    document.removeEventListener('click', playOnce);
    document.removeEventListener('keydown', playOnce);
    document.removeEventListener('touchstart', playOnce);
  }

  document.addEventListener('click', playOnce);
  document.addEventListener('keydown', playOnce);
  document.addEventListener('touchstart', playOnce);
  setTimeout(playOnce, 400);
})();
