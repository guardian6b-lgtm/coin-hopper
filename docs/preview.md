> **Latest coordinated owner build: Stage H / draft PR #27.** Use [Stage H playtest instructions](stage-h-playtest.md) for the exact Windows/browser bundle, checksums and real Android Chrome/iOS Safari same-Wi-Fi path. The old published Pages page and prior artifacts are different builds. No deployment or APK/IPA is supplied. Historical preview notes follow.

# Playable browser preview

## Guarded local preview

From the checkout root with Node.js 22 or later, run:

```sh
node scripts/preview.cjs
```

Open the exact URL printed by the command, usually `http://127.0.0.1:4173/`.
Use `--port 0` to choose an available port or `--port 4180` to choose a specific
one. Press Ctrl+C to stop the server.

The command reads the existing root `index.html` once at startup and serves
those bytes on IPv4 loopback. It accepts GET and HEAD at `/` and `/index.html`
and checks the Host header against the bound address and port. Restart the
preview after editing the HTML. The command supports access from this computer only.

For final Stage G / Issue #14, download **six-level-verification-browser-evidence**
from the verification draft. It contains the complete standalone HTML, final
screenshots/JSON and eight original WAV source loops. Windows artifacts include
NSIS and portable builds, checksums and five complete six-level recorded campaigns
per actual executable. See `docs/release-verification.md` for scoped results and
human acceptance gaps. No deployment or public release is performed.

For Stage F / Issue #16, download **progression-browser-evidence**. Play starts a
new run at Sunny Meadow, keeping earned unlocks. Continue and Level Select start
at a level beginning with **0 points and 3 lives**, through the five-character
picker. Continue is disabled until a run starts. Complete each level to unlock
the next; Level 6 still requires the Guardian. Saves are local to that browser/app;
blocked storage supports in-session progress but cannot retain it after reload.
No mid-level checkpoints are added. See `docs/progression.md` for exact reset rules.

For Stage E / Issue #15, download **music-audio-browser-evidence**. The standalone
page now plays original music after your first click/tap/key interaction. Settings
has independent volumes and Mute all audio; pause/hidden windows stop the loop and
resume retains its position. `music-preview/` includes eight WAV source loops and
a checksum manifest for human listening. Signal tests do not certify audible
quality. See `docs/music-audio.md`; no deployment or public release.

For Stage D / Issue #13, download **visual-redesign-browser-evidence** from the
visual redesign draft PR. Its standalone `index.html` embeds all character artwork;
it needs no CDN, fonts or asset download. `before-stage-d.html` is the verified
Stage C comparison. Before/after screenshots show five viewport sizes, all six
scenes and seven menu fixtures. Windows artifacts contain equivalent actual
packaged captures and temporary executables. See `docs/visual-redesign.md`.

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
- Settings saves independent effects/music volumes and global mute; Stage E includes offline music playback.

The preview does not update the published GitHub Pages game or publish an Electron
release. See `docs/moonlit-gardens.md` in the source branch for test results and
remaining Windows, physical-device, audible-playback, and balancing checks.
See `docs/abilities.md` and `docs/abilities-verification.md` for power rules,
provisional balance and current PASS / FAIL / NOT TESTED results.
