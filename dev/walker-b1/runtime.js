// Installed only by the explicit Walker development switch.
function installWalkerB1({ width, height, pivot, clips }) {
  const tracks = new WeakMap();
  const isWalker = enemy => enemy.type == null || enemy.type === 'walker';
  // One native walk cycle covers 14 2/3 world pixels at the authored patrol speed.
  const stepDistance = 55 / clips.walk.fps;
  let status = 'loading';

  function trackFor(enemy) {
    let track = tracks.get(enemy);
    if (!track) {
      track = { clip: 'idle', ticks: 0, distance: 0, face: Math.sign(enemy.vx) || 1 };
      tracks.set(enemy, track);
    }
    return track;
  }

  function begin(track, clip) {
    track.clip = clip;
    track.ticks = 0;
    track.distance = 0;
  }

  function advance(enemy, track) {
    const dx = enemy.x - track.beforeX;
    const moved = Math.abs(dx) > 1e-7;
    const turned = enemy.vx * track.beforeVx < 0;
    if (turned) track.face = Math.sign(enemy.vx); // The collision tick can still travel in the old direction.
    else if (moved) track.face = Math.sign(dx);

    if (!enemy.ground) {
      begin(track, 'idle'); // No authored flight clip. Hold the neutral frame until contact.
      return;
    }

    const walking = track.clip === 'walk' || track.clip === 'idle_to_walk';
    if (turned && !moved && walking) return; // Zero travel on a wall reversal consumes no gait phase.
    if (moved !== walking) {
      begin(track, moved ? 'idle_to_walk' : 'walk_to_idle');
      return;
    }
    const clip = clips[track.clip];
    if (track.clip === 'walk') {
      track.distance = (track.distance + Math.abs(dx)) % (stepDistance * clip.frames);
    } else if (++track.ticks * DT * clip.fps + 1e-7 >= clip.frames) {
      begin(track, walking ? 'walk' : 'idle');
    }
  }

  function displayed(enemy) {
    const track = trackFor(enemy);
    if (!enemy.ground || reducedMotion()) return { clip: 'idle', frame: 0, face: track.face };
    const clip = track.clip;
    const phase = clip === 'walk' ? track.distance / stepDistance : track.ticks * DT * clips[clip].fps;
    return { clip, frame: Math.floor(phase + 1e-7) % clips[clip].frames, face: track.face };
  }

  function install(images) {
    const baseUpdate = update;
    const baseDraw = drawEnemy;
    update = function updateWithWalkerMotion() {
      if (state !== 'play') return baseUpdate();
      for (const enemy of enemies) {
        if (!isWalker(enemy) || enemy.dead) continue;
        const track = trackFor(enemy);
        track.beforeX = enemy.x;
        track.beforeVx = enemy.vx;
      }
      baseUpdate();
      if (state !== 'play') return;
      for (const enemy of enemies) {
        const track = tracks.get(enemy);
        if (!enemy.dead && track?.beforeX !== undefined) advance(enemy, track);
      }
    };
    drawEnemy = function drawWithWalkerArt(enemy) {
      if (!isWalker(enemy) || enemy.dead) return baseDraw(enemy);
      const { clip, frame, face } = displayed(enemy);
      cx.save();
      cx.translate(enemy.x + enemy.w / 2 - cam, enemy.y + enemy.h);
      cx.scale(face, 1);
      cx.drawImage(images[clip], frame * width, 0, width, height, -pivot[0], -pivot[1], width, height);
      cx.restore();
    };
    status = 'ready';
  }

  function decode([name, clip]) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('Walker strip unavailable'));
      image.onload = async () => {
        try {
          if (image.naturalWidth !== width * clip.frames || image.naturalHeight !== height) {
            throw new Error('Walker strip dimensions disagree with the approved metadata');
          }
          if (typeof image.decode === 'function') await image.decode();
          resolve([name, image]);
        } catch (error) { reject(error); }
      };
      image.src = clip.data;
    });
  }

  // A partial pack never replaces the original renderer. Playback has no state on the enemy or in saves.
  globalThis.walkerB1 = Object.freeze({ get status() { return status; } });
  Promise.all(Object.entries(clips).map(decode))
    .then(pairs => install(Object.fromEntries(pairs)))
    .catch(() => { status = 'failed'; });
}
