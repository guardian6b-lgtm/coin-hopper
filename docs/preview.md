# Playable browser preview

For Stage C / Issue #12, download **skyline-summit-browser-evidence** from the
Skyline draft PR. Its `index.html` contains all six levels and the mandatory Guardian
finale. Every hero has a recorded no-power/no-shield win. The exit stays locked until
the boss is defeated; stomp during its recovery opening. See `docs/skyline-summit.md`
for routes, screenshots and human acceptance gaps. This preview is not a deployment
or public release; Windows builds are temporary CI artifacts only.

For Level 5 / Issue #11, download **crystal-caverns-browser-evidence** from the
`codex/crystal-caverns` draft PR. Extract and open `index.html`; choose a hero and
complete the first four levels to reach Crystal Caverns. All five characters have
recorded no-power/no-shield routes. The game temporarily ends after Level 5;
Skyline Summit/boss are a later stage. See `docs/crystal-caverns.md` for results,
screenshots, optional bonuses and human gates. No public deployment/release.

For enemy Phase 1 / Issue #6, download **enemy-phase-one-browser-evidence** from
the `codex/enemy-balance` draft PR's Gameplay checks run. `index.html` plays the
four unchanged campaign maps; the new enemies have **no placements** there.
Open the separate **enemy-arena.html** to try Shellback or Crystal Sentinel on a
plain test floor. Choose a hero normally, then use Reset Shellback / Reset Sentinel.
This generated review copy is not a campaign level or shipped product UI. Native
Restart resets that arena; title lets you change hero. See `docs/enemies-phase-one.md`
in the source branch for rules and human checks. Screenshots/results and Windows
NSIS/portable verification artifacts are temporary; no public release is created.

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
