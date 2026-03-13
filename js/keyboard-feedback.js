/**
 * Keyboard feedback: when user presses a key, highlight the matching on-screen
 * button so the screen "replicates" the keypress (fun for gamers).
 */
(function () {
  'use strict';

  var KEY_TO_SELECTOR = {
    'ArrowUp': '[data-key="ArrowUp"]',
    'ArrowDown': '[data-key="ArrowDown"]',
    'ArrowLeft': '[data-key="ArrowLeft"]',
    'ArrowRight': '[data-key="ArrowRight"]',
    ' ': '[data-key="Space"]',
    'Enter': '[data-key="Enter"]'
  };

  function getSelectorForKey(key) {
    if (KEY_TO_SELECTOR[key]) return KEY_TO_SELECTOR[key];
    if (key.length === 1 && key >= 'a' && key <= 'z') return '[data-key="Key' + key.toUpperCase() + '"]';
    if (key.length === 1 && key >= 'A' && key <= 'Z') return '[data-key="Key' + key + '"]';
    return null;
  }

  function flashKey(key) {
    var selector = getSelectorForKey(key);
    if (!selector) return;
    var el = document.querySelector(selector);
    if (!el || el.disabled) return;
    el.classList.add('key-press');
    el.setAttribute('aria-pressed', 'true');
    setTimeout(function () {
      el.classList.remove('key-press');
      el.removeAttribute('aria-pressed');
    }, 120);
  }

  document.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    flashKey(e.key);
  });
})();
