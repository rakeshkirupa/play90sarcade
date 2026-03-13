/**
 * 90s Arcade — Client-side security
 * Rate limiting, secure session storage, safe defaults for cookies.
 * DDoS mitigation at origin is done by host/CDN; this reduces abuse from scripts and rapid input.
 */
(function (global) {
  'use strict';

  var ALLOWED_STORAGE_KEYS = ['snakeBest', 'tetrisBest', 'brickBest', 'hangmanBest', 'memoryBest'];
  var MAX_SCORE = 999999;
  var MAX_STORAGE_VALUE_LENGTH = 32;
  var RATE_LIMIT_WINDOW_MS = 1000;
  var RATE_LIMIT_MAX_ACTIONS = 30;
  var RATE_LIMIT_MAX_GAME_STARTS = 5;
  var actionTimestamps = [];
  var gameStartTimestamps = [];

  function isAllowedKey(key) {
    if (typeof key !== 'string') return false;
    return ALLOWED_STORAGE_KEYS.indexOf(key) !== -1;
  }

  function sanitizeScoreValue(val) {
    var n = parseInt(val, 10);
    if (Number.isNaN(n) || n < 0) return 0;
    if (n > MAX_SCORE) return MAX_SCORE;
    return n;
  }

  /**
   * Secure session storage: allowlist keys, sanitize values (scores only), limit size.
   */
  var SecureSessionStorage = {
    get: function (key) {
      try {
        if (!isAllowedKey(key)) return null;
        var raw = global.sessionStorage.getItem(key);
        if (raw === null || raw === '') return null;
        if (raw.length > MAX_STORAGE_VALUE_LENGTH) return null;
        return raw;
      } catch (e) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        if (!isAllowedKey(key)) return;
        var s = value === null || value === undefined ? '' : String(value);
        if (s.length > MAX_STORAGE_VALUE_LENGTH) return;
        if (key.indexOf('Best') !== -1) {
          var n = sanitizeScoreValue(s);
          s = String(n);
        }
        global.sessionStorage.setItem(key, s);
      } catch (e) {
        /* ignore storage errors */
      }
    }
  };

  /**
   * Secure local storage: same allowlist/sanitization, persistent high scores across sessions.
   */
  var SecureLocalStorage = {
    get: function (key) {
      try {
        if (!isAllowedKey(key)) return null;
        var raw = global.localStorage.getItem(key);
        if (raw === null || raw === '') return null;
        if (raw.length > MAX_STORAGE_VALUE_LENGTH) return null;
        return raw;
      } catch (e) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        if (!isAllowedKey(key)) return;
        var s = value === null || value === undefined ? '' : String(value);
        if (s.length > MAX_STORAGE_VALUE_LENGTH) return;
        if (key.indexOf('Best') !== -1) {
          var n = sanitizeScoreValue(s);
          s = String(n);
        }
        global.localStorage.setItem(key, s);
      } catch (e) {
        /* ignore storage errors */
      }
    }
  };

  /**
   * Rate limit: returns true if action is allowed, false if over limit.
   */
  function allowAction() {
    var now = Date.now();
    actionTimestamps = actionTimestamps.filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
    if (actionTimestamps.length >= RATE_LIMIT_MAX_ACTIONS) return false;
    actionTimestamps.push(now);
    return true;
  }

  function allowGameStart() {
    var now = Date.now();
    gameStartTimestamps = gameStartTimestamps.filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
    if (gameStartTimestamps.length >= RATE_LIMIT_MAX_GAME_STARTS) return false;
    gameStartTimestamps.push(now);
    return true;
  }

  /**
   * Throttled wrapper: run fn at most once per intervalMs.
   */
  function throttle(fn, intervalMs) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= intervalMs) {
        last = now;
        return fn.apply(this, arguments);
      }
    };
  }

  /**
   * Secure cookie helper (for future use). Use Secure, SameSite; prefer session or short maxAge.
   * Note: httpOnly must be set server-side; client-set cookies are script-accessible by design.
   */
  function setCookie(name, value, options) {
    if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) return;
    var s = name + '=' + encodeURIComponent(String(value));
    var opts = options || {};
    if (opts.maxAge != null) s += '; max-age=' + Math.floor(Number(opts.maxAge));
    if (opts.secure !== false) s += '; Secure';
    if (opts.sameSite !== false) s += '; SameSite=Lax';
    if (opts.path) s += '; path=' + opts.path;
    try {
      document.cookie = s;
    } catch (e) { /* ignore */ }
  }

  function getCookie(name) {
    if (typeof name !== 'string') return null;
    var match = document.cookie.match(new RegExp('(?:^|;)\\s*' + name.replace(/[\\.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*([^;]*)'));
    try {
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Install global rate limiting for high-frequency events (reduce impact of scripts/bots).
   */
  function installEventThrottle() {
    var throttleMs = 100;
    var onKeyDown = throttle(function (e) {
      if (!allowAction()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }, throttleMs);
    var onClick = throttle(function (e) {
      if (!allowAction()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }, throttleMs);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('click', onClick, true);
  }

  /* Expose API */
  global.SecureSessionStorage = SecureSessionStorage;
  global.SecureLocalStorage = SecureLocalStorage;
  global.SecurityRateLimit = {
    allowAction: allowAction,
    allowGameStart: allowGameStart,
    throttle: throttle
  };
  global.SecurityCookies = { set: setCookie, get: getCookie };

  /* Install event throttle when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installEventThrottle);
  } else {
    installEventThrottle();
  }
})(typeof window !== 'undefined' ? window : this);
