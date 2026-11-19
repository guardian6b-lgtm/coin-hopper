// Injected only by the opt-in development launcher. Never loaded by index.html.
function installEmberV31(pack) {
  const baseUpdate = update;
  const baseDraw = drawCharacter;
  const { clips, runEntry, stridePixels } = pack;
  const images = {};
  const frameDistance = stridePixels / clips.run.count;
  const epsilon = 1e-7;
  const jumpFrameTicks = Math.round(1 / (clips.jump.fps * DT));
  const landingTicks = jumpFrameTicks * (clips.jump.holds[5] ?? 1);
  let ready = false;
  let failed = false;
  let remaining = Object.keys(clips).length;
  let track = null;
  let painted = { source: 'procedural', clip: null, index: null, face: null };

  for (const [name, clip] of Object.entries(clips)) {
    const image = new Image();
    images[name] = image;
    image.onload = () => {
      if (image.naturalWidth !== clip.width * clip.count || image.naturalHeight !== clip.height) {
        failed = true;
        return;
      }
      remaining--;
      if (!remaining && !failed) ready = true;
    };
    image.onerror = () => { failed = true; };
    image.src = clip.data;
  }

  function idle(face) {
    const ticks = track.clip === 'idle' ? track.ticks + 1 : 0;
    const index = Math.floor(ticks * DT * clips.idle.fps + epsilon) % clips.idle.count;
    Object.assign(track, { clip: 'idle', index, face, ticks, direction: 0, phase: 0 });
  }

  function airborne(player) {
    const ticks = track.clip === 'jump' && track.index < 5 ? track.ticks + 1 : 0;
    // Vertical velocity selects the flight phase. Frame 0 is an anticipation
    // pose and cannot be placed in front of the game's immediate takeoff.
    let index;
    if (player.vy < -75) index = ticks < jumpFrameTicks ? 1 : 2;
    else index = player.vy > 75 ? 4 : 3;
    Object.assign(track, { clip: 'jump', index, face: player.face, ticks, direction: 0, phase: 0 });
  }

  function grounded(player, before) {
    if (!before.ground) {
      Object.assign(track, { clip: 'jump', index: 5, face: player.face, ticks: 0, direction: 0, phase: 0 });
      return;
    }
    const delta = player.x - before.x;
    if (Math.abs(delta) <= epsilon) {
      if (track.clip === 'jump' && track.index >= 5) {
        const ticks = track.ticks + 1;
        if (ticks < landingTicks + jumpFrameTicks) {
          Object.assign(track, { index: ticks < landingTicks ? 5 : 6, face: player.face, ticks });
          return;
        }
      }
      idle(player.face);
      return;
    }

    const direction = Math.sign(delta);
    const traveled = Math.abs(delta);
    track.distance += traveled;
    if (track.direction !== direction) {
      // A true start uses the four authored acceleration frames. A reversal
      // under inertia instead re-enters the run cycle when actual travel turns.
      const fromRest = track.direction === 0 && Math.abs(before.vx) <= epsilon;
      Object.assign(track, {
        clip: fromRest ? 'runstart' : 'run', index: fromRest ? 0 : runEntry,
        face: direction, direction, ticks: 0, phase: 0
      });
    } else if (track.clip === 'runstart') {
      const accelerating = direction * player.vx >= direction * before.vx - epsilon;
      if (accelerating && track.index + 1 < clips.runstart.count) track.index++;
      else Object.assign(track, { clip: 'run', index: runEntry, phase: 0 });
    } else {
      track.phase = (track.phase + traveled) % stridePixels;
      const step = Math.floor((track.phase + epsilon) / frameDistance);
      track.index = (runEntry + step) % clips.run.count;
    }
  }

  update = function updateWithEmberObservation() {
    const player = pl;
    const before = player && { x: player.x, vx: player.vx, ground: player.ground };
    const level = lvl;
    baseUpdate();
    if (state !== 'play') return;
    if (pl?.character !== 'ember') {
      track = null;
      return;
    }
    if (track?.player !== pl || player !== pl || level !== lvl) {
      track = { player: pl, face: pl.face, direction: 0, phase: 0, ticks: 0, distance: 0 };
      if (pl.ground) idle(pl.face);
      else airborne(pl);
      return;
    }
    if (pl.ground) grounded(pl, before);
    else airborne(pl);
  };

  drawCharacter = function drawWithEmberPreview(ctx, id, x, y, w, h, face, pose, ...rest) {
    if (ctx !== cx || !rest[4]) return baseDraw(ctx, id, x, y, w, h, face, pose, ...rest);
    const locomotion = pose === 'idle' || pose === 'run' || pose === 'jump' || pose === 'fall' || pose === 'land';
    // Preserve the existing Fireball gesture and its registered hand cues for
    // charge, release and recovery. All other unsupported poses also fall back.
    if (!ready || failed || id !== 'ember' || track?.player !== pl ||
        !locomotion || ability.charging || ability.cast > 0 || abilityEdge) {
      painted = { source: 'procedural', clip: null, index: null, face: null };
      return baseDraw(ctx, id, x, y, w, h, face, pose, ...rest);
    }
    const { clip, index, face: spriteFace } = track;
    const { width, height, pivot } = clips[clip];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(spriteFace, 1);
    // One source pixel is one world pixel. The native art has a similar rest
    // silhouette to the procedural rig despite its different normalization.
    ctx.drawImage(images[clip], index * width, 0, width, height, -pivot[0], -pivot[1], width, height);
    ctx.restore();
    painted = { source: 'sprite', clip, index, face: spriteFace };
  };

  globalThis.emberV31 = Object.freeze({
    snapshot: () => ({ ready, failed, ...painted, distance: track?.distance ?? 0 })
  });
}
