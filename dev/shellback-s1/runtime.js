
// Installed only by the explicit Shellback development flag.
function installShellbackS1({ width, height, pivot, sprites }) {
  let status = 'loading';
  function load([name, data]) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('Shellback image unavailable'));
      image.onload = async () => {
        try {
          if (image.naturalWidth !== width || image.naturalHeight !== height) {
            throw new Error('Shellback dimensions differ from the approved master');
          }
          if (typeof image.decode === 'function') await image.decode();
          resolve([name, image]);
        } catch (error) { reject(error); }
      };
      image.src = data;
    });
  }
  globalThis.shellbackS1 = Object.freeze({ get status() { return status; } });
  Promise.all(Object.entries(sprites).map(load)).then(entries => {
    const images = Object.fromEntries(entries);
    const baseDraw = drawArmoredEnemy;
    drawArmoredEnemy = function drawWithShellbackMaster(enemy) {
      if (enemy.type !== 'shellback') return baseDraw(enemy);
      if (enemy.dead < 0) return;
      const image = enemy.health < enemy.maxHealth ? images.cracked : images.intact;
      cx.save();
      cx.translate(enemy.x + enemy.w / 2 - cam, enemy.y + enemy.h);
      const face = Math.sign(enemy.vx) || -1;
      // Reuse the existing defeat squash and timer, with the same foot anchor.
      cx.scale(face * (enemy.dead ? 1.3 : 1), enemy.dead ? 0.3 : 1);
      cx.drawImage(image, -pivot[0], -pivot[1], width, height);
      // Preserve the shared damage flash around the approved body.
      if (enemy.hitFlash > 0) {
        cx.globalAlpha = 0.65;
        cx.fillStyle = '#fff';
        rr(-enemy.w / 2, -enemy.h, enemy.w, enemy.h, 8);
        cx.fill();
        cx.globalAlpha = 1;
      }
      cx.restore();
    };
    status = 'ready';
  }).catch(() => { status = 'failed'; });
}
