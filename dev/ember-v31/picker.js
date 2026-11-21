// Menu-only artwork. The gameplay loader supplies one already-validated image.
function installRosterPicker(idle, drawPlayableCharacter) {
  const baseCards = characterCards;
  const descriptions = {
    hopper: 'Leap, then slam nearby enemies.',
    minty: 'Root an enemy in front of you.',
    ember: 'Launch a fireball straight ahead.',
    nova: 'Slow your fall while airborne.',
    bolt: 'Strike ahead and chain to nearby foes.'
  };
  let emberIdle; // Undefined while decoding, null when gameplay falls back.

  drawPortrait = function drawRosterPortrait(canvas, id) {
    let source = 'rig';
    if (id === 'ember' && emberIdle !== null) source = emberIdle ? 'idle-strip' : 'loading';
    // Selection lives on the button. A static portrait needs repainting only
    // when its hero or validated art source changes.
    if (canvas.dataset.hero === id && canvas.dataset.portrait === source) return;
    canvas.dataset.hero = id;
    canvas.dataset.portrait = source;
    canvas.width = 320;
    canvas.height = 224;
    if (source === 'loading') return;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(2, 2); // 160 × 112 logical portrait, sampled at twice the resolution.
    if (source === 'idle-strip') {
      const scale = 1.5;
      // Center the cell horizontally; place the recorded foot pivot on the
      // common floor. Selection uses the very same frame zero as spawn.
      ctx.translate(80 + scale * (idle.pivot[0] - idle.width / 2), 97);
      ctx.scale(scale, scale);
      ctx.drawImage(emberIdle, 0, 0, idle.width, idle.height,
        -idle.pivot[0], -idle.pivot[1], idle.width, idle.height);
    } else {
      ctx.translate(80, 97);
      ctx.scale(1.7, 1.7);
      drawPlayableCharacter(ctx, id, 0, 0, 26, 32, 1, 'idle', 0);
    }
    ctx.restore();
  };

  function refreshEmberCard() {
    if (state !== 'characters') return;
    const card = menuContent.querySelector('[data-character="ember"]');
    if (!card) return;
    drawPortrait(card.querySelector('canvas'), 'ember');
    card.setAttribute('aria-busy', String(emberIdle === undefined));
    const note = card.querySelector('[data-portrait-note]');
    note.hidden = !!emberIdle;
    note.textContent = emberIdle ? '' : emberIdle === null ? 'Standard artwork' : 'Loading artwork…';
  }

  characterCards = function buildRosterCards() {
    baseCards();
    menuTitle.textContent = 'Choose your hero';
    menuDescription.textContent = 'Level ' + (pendingStartIndex + 1) + ' · ' + LEVELS[pendingStartIndex].name +
      (touchMode ? ' · Tap a hero to choose.' : ' · Choose with the arrow keys or click a hero.');
    for (const { id } of CHARACTERS) {
      document.getElementById(id + '-power').textContent = ABILITIES[id].name;
      document.getElementById(id + '-flavor').textContent = descriptions[id];
      const card = document.getElementById('character-' + id);
      card.setAttribute('aria-describedby', id + '-power ' + id + '-flavor' + (id === 'ember' ? ' ember-portrait-note' : ''));
    }
    const note = document.createElement('span');
    note.id = 'ember-portrait-note';
    note.setAttribute('data-portrait-note', '');
    document.getElementById('character-ember').appendChild(note);
    refreshEmberCard();
  };

  return function setEmberPortrait(image) {
    emberIdle = image;
    refreshEmberCard();
  };
}
