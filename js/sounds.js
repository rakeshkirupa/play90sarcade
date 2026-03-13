/**
 * 90s Arcade — Retro beep sounds via Web Audio API
 * No external files; old mobile / arcade style beeps
 */
(function (global) {
  'use strict';

  let audioContext = null;

  function getContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  /**
   * Play a short beep (e.g. button press)
   */
  function playButtonSound() {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 720;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Tetris: line clear (satisfying blip)
   */
  function playLineClearSound() {
    const ctx = getContext();
    const notes = [440, 554.37, 659.25];
    const start = ctx.currentTime;
    notes.forEach(function (freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      const t = start + i * 0.06;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  /**
   * Play eat food sound (higher, cheerful blip)
   */
  function playEatSound() {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Play game over (lower, two-tone losing beep)
   */
  function playGameOverSound() {
    const ctx = getContext();
    const playTone = function (freq, start, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(200, ctx.currentTime, 0.15);
    playTone(150, ctx.currentTime + 0.15, 0.2);
  }

  /**
   * 90s-style new high score: celebration jingle in background + voice "New high score"
   */
  function playNewHighScoreCelebration() {
    const ctx = getContext();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const start = ctx.currentTime;
    notes.forEach(function (freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      const t = start + i * 0.12;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
    speakNewHighScore();
  }

  /**
   * Homepage: subtle looping arcade ambience (start after first interaction)
   */
  let ambienceInterval = null;
  function startHomepageAmbience() {
    if (ambienceInterval) return;
    const ctx = getContext();
    ambienceInterval = setInterval(function () {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 220;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }, 2400);
  }
  function stopHomepageAmbience() {
    if (ambienceInterval) {
      clearInterval(ambienceInterval);
      ambienceInterval = null;
    }
  }

  /**
   * Start game: old arcade "start" style sound (like pressing start)
   */
  function playEnteringGameSound() {
    const ctx = getContext();
    const notes = [400, 600, 800];
    const start = ctx.currentTime;
    notes.forEach(function (freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      const t = start + i * 0.08;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  /**
   * Speak game name in fight / old arcade announcer tone (first time entering game)
   */
  function speakGameName(gameName) {
    if (!window.speechSynthesis || !gameName) return;
    const text = String(gameName).trim() || 'Game';
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.75;
    u.pitch = 0.92;
    u.volume = 0.95;
    window.speechSynthesis.speak(u);
  }

  /**
   * Speak "Let's go" in angry fight voice (on restart after game over)
   */
  function speakRestart() {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance("Let's go");
    u.rate = 1.15;
    u.pitch = 0.82;
    u.volume = 0.95;
    window.speechSynthesis.speak(u);
  }

  /**
   * Speak "Next round" (e.g. when player clears a level / wins the round)
   */
  function speakNextRound() {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance('Next round');
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 0.95;
    window.speechSynthesis.speak(u);
  }

  /**
   * Speak "New high score" with celebration tone (used with jingle in background)
   */
  function speakNewHighScore() {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance('New high score');
    u.rate = 0.9;
    u.pitch = 1.1;
    u.volume = 0.95;
    window.speechSynthesis.speak(u);
  }

  /**
   * Homepage: Star Wars–style theme when opened (ascending fanfare)
   */
  function playHomepageTheme() {
    const ctx = getContext();
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
    const start = ctx.currentTime;
    notes.forEach(function (freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const t = start + i * 0.35;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // Resume context on first user interaction (browser policy)
  function resumeOnInteraction() {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * Try to resume AudioContext and run callback (for homepage default sound).
   * Some browsers allow resume() after a short delay; callback runs when context is running.
   */
  function tryResumeAndRun(callback) {
    if (typeof callback !== 'function') return;
    const ctx = getContext();
    if (ctx.state === 'running') {
      callback();
      return;
    }
    ctx.resume().then(function () {
      callback();
    }).catch(function () {
      callback();
    });
  }

  ['keydown', 'click', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, resumeOnInteraction, { once: true });
  });

  global.playButtonSound = playButtonSound;
  global.playEatSound = playEatSound;
  global.playLineClearSound = playLineClearSound;
  global.playGameOverSound = playGameOverSound;
  global.playNewHighScoreCelebration = playNewHighScoreCelebration;
  global.startHomepageAmbience = startHomepageAmbience;
  global.stopHomepageAmbience = stopHomepageAmbience;
  global.playEnteringGameSound = playEnteringGameSound;
  global.speakGameName = speakGameName;
  global.speakRestart = speakRestart;
  global.speakNextRound = speakNextRound;
  global.speakNewHighScore = speakNewHighScore;
  global.playHomepageTheme = playHomepageTheme;
  global.tryResumeAndRun = tryResumeAndRun;
})(typeof window !== 'undefined' ? window : this);
