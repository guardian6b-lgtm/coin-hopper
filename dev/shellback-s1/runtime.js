
// Installed only by the explicit Shellback development flag.
function installShellbackS1({ width, height, pivot, sprites, frames, stride }) {
  let status = 'loading';
  const tracks = new WeakMap();
  function trackFor(enemy) {
    let track = tracks.get(enemy);
    if (!track) {
      track = { distance: 0, face: Math.sign(enemy.vx) || -1 };
      tracks.set(enemy, track);
    }
    return track;
  }
  function load([name, data]) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('Shellback image unavailable'));
      image.onload = async () => {
        try {
          if (image.naturalWidth !== width * frames || image.naturalHeight !== height) {
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
    const baseUpdate = update;
    update = function updateWithShellbackWalk() {
      if (state !== 'play') return baseUpdate();
      for (const enemy of enemies) {
        if (enemy.type === 'shellback' && !enemy.dead) trackFor(enemy).beforeX = enemy.x;
      }
      baseUpdate();
      if (state !== 'play') return;
      for (const enemy of enemies) {
        if (enemy.type !== 'shellback' || enemy.dead) continue;
        const track = trackFor(enemy);
        track.face = Math.sign(enemy.vx) || track.face;
        const distance = Math.abs(enemy.x - track.beforeX);
        // At 40 px/s, 2 resolved world pixels advance one frame: 20 fps / 0.5 s per loop.
        // Roots, wall contact and airborne travel consume no grounded stride.
        if (enemy.ground && distance > 1e-7 && !reducedMotion()) {
          track.distance = (track.distance + distance) % stride;
        }
      }
    };
    const baseDraw = drawArmoredEnemy;
    drawArmoredEnemy = function drawWithShellbackMaster(enemy) {
      if (enemy.type !== 'shellback') return baseDraw(enemy);
      if (enemy.dead < 0) return;
      const damaged = enemy.health < enemy.maxHealth ? 'cracked' : 'intact';
      const track = trackFor(enemy);
      const face = Math.sign(enemy.vx) || track.face;
      const frame = Math.floor(track.distance / (stride / frames) + 1e-7) % frames;
      cx.save();
      cx.translate(enemy.x + enemy.w / 2 - cam, enemy.y + enemy.h);
      // Reuse the existing defeat squash and timer, with the same foot anchor.
      cx.scale(face * (enemy.dead ? 1.3 : 1), enemy.dead ? 0.3 : 1);
      // Frame zero is also the initial hold pose. Damage never changes the track.
      cx.drawImage(images[damaged], frame * width, 0, width, height, -pivot[0], -pivot[1], width, height);
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
