// Injected only by the opt-in development launcher. Never loaded by index.html.
function installEmberV31(pack) {
  const baseUpdate = update;
  const baseDraw = drawCharacter;
  const baseSpawn = spawn;
  const baseHurt = hurt;
  const baseConfirm = confirmCharacter;
  const baseMenu = syncMenu;
  const baseChoose = chooseCharacter;
  const { clips, runEntry, stridePixels } = pack;
  // A shared envelope keeps changing cells and facing from shifting the body
  // at the left world edge. Include the full transparent source cell.
  const leftReach = Math.max(...Object.values(clips).map(clip =>
    Math.max(clip.pivot[0], clip.width - clip.pivot[0])));
  const images = {};
  const frameDistance = stridePixels / clips.run.count;
  // Closest run-start silhouette to each run cel at its foot pivot (native
  // premultiplied RGBA difference). Retrace from there to the standing pose.
  const stopEntryByRunFrame = [1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 3, 3, 3, 3, 3];
  const epsilon = 1e-7;
  const jumpFrameTicks = Math.round(1 / (clips.jump.fps * DT));
  const landingTicks = jumpFrameTicks * (clips.jump.holds[5] ?? 1);
  let ready = false;
  let failed = false;
  let remaining = Object.keys(clips).length;
  emberV31GroundShadowReady = () => ready && !failed;
  let track = null;
  let painted = { source: 'procedural', clip: null, index: null, face: null };

  function waitingForEmber() {
    return state === 'characters' && pendingCharacter === 'ember' && !ready && !failed;
  }

  function refreshStartButton() {
    if (state !== 'characters') return;
    const button = menuActions.firstElementChild;
    if (!button) return;
    const waiting = waitingForEmber();
    button.textContent = waiting ? 'Loading Ember artwork…' : 'Start game';
    if (button.disabled === waiting) return;
    button.disabled = waiting;
    if (waiting) {
      menuItems = menuItems.filter(item => item !== button);
    } else {
      const back = menuItems.indexOf(menuActions.children[1]);
      menuItems.splice(back < 0 ? menuItems.length : back, 0, button);
    }
  }

  syncMenu = function syncEmberMenu() {
    baseMenu();
    refreshStartButton();
  };
  chooseCharacter = function chooseWithEmberReadiness(id, focus) {
    baseChoose(id, focus);
    refreshStartButton();
  };
  confirmCharacter = function confirmWithEmberReadiness() {
    if (!waitingForEmber()) baseConfirm();
  };

  function failPack() {
    failed = true;
    ready = false;
    refreshStartButton();
  }

  async function acceptImage(image, clip) {
    if (failed) return;
    if (image.naturalWidth !== clip.width * clip.count || image.naturalHeight !== clip.height) {
      failPack();
      return;
    }
    try {
      if (typeof image.decode === 'function') await image.decode();
    } catch {
      failPack();
      return;
    }
    if (failed) return;
    if (--remaining === 0) {
      ready = true;
      refreshStartButton();
    }
  }

  for (const [name, clip] of Object.entries(clips)) {
    const image = new Image();
    images[name] = image;
    image.onload = () => { void acceptImage(image, clip); };
    image.onerror = failPack;
    image.src = clip.data;
  }

  function freshTrack(player, fromSpawn) {
    return {
      player, clip: 'idle', index: 0, face: player.face,
      direction: 0, phase: 0, ticks: 0, distance: 0, stopping: false,
      spawnProtection: fromSpawn, settling: fromSpawn && !player.ground
    };
  }

  spawn = function spawnWithEmberIdle() {
    baseSpawn();
    track = pl.character === 'ember' ? freshTrack(pl, true) : null;
  };

  hurt = function hurtWithEmberObservation(fall) {
    const player = pl;
    const applied = baseHurt(fall);
    // Shield/Core damage retains the player object. A life-loss respawn gets
    // its own idle track and protection from spawn(), even inside hurt().
    if (applied && pl === player && track?.player === player) track.spawnProtection = false;
    return applied;
  };

  function idle(face) {
    const ticks = track.clip === 'idle' ? track.ticks + 1 : 0;
    const index = Math.floor(ticks * DT * clips.idle.fps + epsilon) % clips.idle.count;
    Object.assign(track, { clip: 'idle', index, face, ticks, direction: 0, phase: 0, stopping: false });
  }

  function airborne(player) {
    const ticks = track.clip === 'jump' && track.index < 5 ? track.ticks + 1 : 0;
    // Vertical velocity selects the flight phase. Frame 0 is an anticipation
    // pose and cannot be placed in front of the game's immediate takeoff.
    let index;
    if (player.vy < -75) index = ticks < jumpFrameTicks ? 1 : 2;
    else index = player.vy > 75 ? 4 : 3;
    Object.assign(track, { clip: 'jump', index, face: player.face, ticks, direction: 0, phase: 0, stopping: false });
  }

  function settleRun() {
    if (track.clip !== 'run' && track.clip !== 'runstart') return false;
    if (!track.stopping) {
      const index = track.clip === 'run' ? stopEntryByRunFrame[track.index] : track.index;
      Object.assign(track, { clip: 'runstart', index, ticks: 0, direction: 0, phase: 0, stopping: true });
    } else if (++track.ticks % 2 === 0) {
      if (track.index === 0) return false;
      track.index--;
    }
    return true;
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
      if (!settleRun()) idle(player.face);
      return;
    }

    const direction = Math.sign(delta);
    const traveled = Math.abs(delta);
    track.stopping = false;
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
      // A short tap can brake during run-start. Keep its existing lean until
      // travel stops or acceleration resumes, without jumping to a sprint pose.
      if (!accelerating) return;
      if (track.index + 1 < clips.runstart.count) track.index++;
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
    if (track?.player !== pl) {
      track = freshTrack(pl, false);
      if (pl.ground) idle(pl.face);
      else airborne(pl);
      return;
    }
    if (player !== pl || level !== lvl) return;
    if (track.settling) {
      // R6-C spawns above the floor with ground=false. The first passive
      // drop uses idle, and its ground contact is not an animated landing.
      if (!pl.ground && pl.vy >= 0) {
        track.face = pl.face;
        return;
      }
      track.settling = false;
      if (pl.ground) before.ground = true;
    }
    if (pl.ground) grounded(pl, before);
    else airborne(pl);
  };

  function usesSprite(id, pose) {
    const locomotion = pose === 'idle' || pose === 'run' || pose === 'jump' || pose === 'fall' || pose === 'land' ||
      (pose === 'hurt' && track?.spawnProtection);
    return ready && !failed && id === 'ember' && track?.player === pl &&
      locomotion && !ability.charging && ability.cast <= 0 && !abilityEdge;
  }

  function leftBoundaryInset(player) {
    const overhang = leftReach - player.w / 2;
    if (overhang <= 0 || player.x >= 2 * overhang) return 0;
    // Full clearance at the wall, easing back to the real foot anchor as the
    // player moves away. Use world position so camera scrolling cannot trigger it.
    const proximity = 1 - Math.max(0, player.x) / (2 * overhang);
    return overhang * proximity * proximity;
  }

  emberV31ShadowOffset = (player, anchors) =>
    usesSprite(player.character, anchors.visual.pose) ? leftBoundaryInset(player) : 0;

  drawCharacter = function drawWithEmberPreview(ctx, id, x, y, w, h, face, pose, ...rest) {
    if (ctx !== cx || !rest[4]) return baseDraw(ctx, id, x, y, w, h, face, pose, ...rest);
    if (!usesSprite(id, pose)) {
      painted = { source: 'procedural', clip: null, index: null, face: null };
      return baseDraw(ctx, id, x, y, w, h, face, pose, ...rest);
    }
    const { clip, index, face: spriteFace } = track;
    const { width, height, pivot } = clips[clip];
    ctx.save();
    ctx.translate(x + leftBoundaryInset(pl), y);
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
