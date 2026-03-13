/**
 * 90s Arcade — Homepage background animations
 * Injects extra floating elements for a more dynamic retro feel
 */
(function () {
  'use strict';

  const container = document.querySelector('.pixel-blocks');
  if (!container) return;

  // Add a few extra pixel blocks for variety
  const colors = ['#00d4ff', '#ff007f', '#ffe600', '#6a00ff'];
  for (let i = 0; i < 8; i++) {
    const block = document.createElement('div');
    block.className = 'pixel-block';
    block.style.cssText = [
      'position: absolute',
      'width: 8px',
      'height: 8px',
      'background: ' + colors[i % colors.length],
      'left: ' + (10 + Math.random() * 80) + '%',
      'top: ' + (10 + Math.random() * 80) + '%',
      'opacity: 0.4',
      'animation: pixelBlockFloat ' + (4 + Math.random() * 6) + 's ease-in-out infinite',
      'animation-delay: ' + Math.random() * 2 + 's'
    ].join(';');
    container.appendChild(block);
  }

  // Inject keyframes for pixel blocks via a style tag (optional enhancement)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pixelBlockFloat {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(10px, -10px) rotate(90deg); }
      50% { transform: translate(-5px, -20px) rotate(180deg); }
      75% { transform: translate(-10px, -5px) rotate(270deg); }
    }
  `;
  document.head.appendChild(style);
})();
