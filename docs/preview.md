# Playable browser preview

For Issue #5, download **character-abilities-browser-evidence** from the
`codex/character-abilities` draft PR's Gameplay checks run. It includes the
self-contained `index.html`, preview instructions, screenshots and browser results.
Extract and open `index.html`; choose Play, a character, then Start game. Use **E**
or **Ability** for that character's power (Hopper/Nova airborne only). Shared default
movement, hitboxes and scores stay the same, and no ability is required to finish.
Phone menus scroll when needed, including in short viewports. Issue #4's parent
artifact `character-select-browser-evidence` still contains its cosmetic-only game.
The Windows verification workflow separately retains installer/portable evidence
as temporary artifacts; it never creates a release.

Download the **coin-hopper-browser-preview** artifact from the Gameplay checks run
for `codex/moonlit-gardens`, extract the ZIP, and open its top-level `index.html`.
The game is self-contained and works offline; no installation or server is needed.
The artifact is uploaded by CI after its Linux gameplay tests pass. A local test
run does not establish that a hosted artifact has been uploaded.

Choose Play, confirm your character with Start game, and complete Sunny Meadow,
Brick Hills, and Starry Night to reach
**Moonlit Gardens**. Stage 3 adds only this fourth level, hopping enemies, and a
one-hit shield. A shield is helpful but optional; all four levels have recorded
damage-free routes that collect no shield pickups.

- Move: arrows or A/D. Jump: Space, W, or Up; hold for height.
- Pause/resume: P or Escape. Phones use the canvas touch controls.
- Ability: E or the separate Ability button. The HUD shows readiness/cooldown;
  choose another character from title for a different power. No auto-repeat.
- Mint leaf-eared enemies hop predictably. Stomp for the usual 50 points.
- Pick up the cyan shield. Its bubble and SHIELD label mean one enemy/spike hit
  will be absorbed. Pits still cost a life. Restart restores the level's pickups.
- Settings saves effects/music volume preferences. Music playback is not included.

The preview does not update the published GitHub Pages game or publish an Electron
release. See `docs/moonlit-gardens.md` in the source branch for test results and
remaining Windows, physical-device, audible-playback, and balancing checks.
See `docs/abilities.md` and `docs/abilities-verification.md` for power rules,
provisional balance and current PASS / FAIL / NOT TESTED results.
