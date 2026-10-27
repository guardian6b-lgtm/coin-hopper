# Baseline verification

For the stacked character powers, see [ability rules](abilities.md) and the
[135-test, 38-browser-check verification report](abilities-verification.md).
The next stacked phase adds [shared enemy HP and two unplaced prototypes](enemies-phase-one.md);
see its [196-test, 54-browser-check verification](enemies-verification.md).
Stage B places those types in [Crystal Caverns](crystal-caverns.md), with 211 Node
tests, 64 browser groups and five-character no-power campaign/bonus routes.
Stage C adds [Skyline Summit and the required Guardian](skyline-summit.md): 241 Node
tests, 79 browser groups, all 30 hero/level routes and five recorded no-power boss wins.
The checklist below remains the shared baseline.

Visual V1 adds character selection before Start game. The
[character design/verification note](character-select.md) covers the new flow,
versioned preference, identical-gameplay checks and screenshot evidence.

For the completed PR #1 technical verification, results, and remaining manual checks,
see [the verification report](verification-pr-1.md).

For the four-level Stage 3 Windows builds and final technical/human acceptance
matrix, see [Stage 3 final verification](stage-3-final-verification.md).

## Automated checks

Use Node.js 22 or later from the repository root:

```sh
node --test
```

No dependency installation is needed for these checks. The test harness executes the
inline script from index.html in an isolated VM with stubbed browser, canvas, audio,
and storage services. Each test starts with fresh game state. It exercises simulation
behavior; it does not verify real canvas output, device touch handling, sound playback,
or an installed Windows app.

The Gameplay checks workflow runs on Linux and Windows and offers an index.html
artifact from the Linux job. Extract the artifact and open index.html in a browser
to review the branch without publishing changes to the live game.

## Menus and convenience checks

The automated checks also exercise native menu actions and keyboard focus, nested
pause/settings/control screens, live effects gain and persisted settings, restart
confirmation and score rollback, touch input cleanup, completion coin counts,
blocked storage, and duplicate-click protection. Recorded input routes complete
all four levels without damage or collecting shields, including a continuous run
using the real menu actions. Stage 3 tests cover hopping timing/patrol/stomps,
shield collection and non-stacking, enemy/spike absorption, pit deaths, recovery,
pause freezing, restart, and completion resets. See [the Stage 3 guide](moonlit-gardens.md).

A restart rebuilds the current level and removes only its earned points from the
run score. It preserves points from earlier levels and the remaining lives. Cancel
and Escape leave all progress intact. Music volume is saved as a preference;
music playback remains a later upgrade.

## Manual playtest gate

Record the branch commit, browser/device, result, and any issue for each item.

- Start a new run: score 0, three lives, Sunny Meadow. Test arrows and A/D; jump with
  Space, W, and Up. Compare short taps and held jumps.
- Finish Sunny Meadow, Brick Hills, Starry Night, and Moonlit Gardens in order. Confirm each flag
  grants its completion award once, and the final level leads to the win screen.
  Collecting every coin remains optional.
- Collect a coin, move away and return: score increases by 10 only once. After a
  death, collected coins stay collected and earned score stays earned.
- Stomp an enemy: earn 50 once, bounce, and see the squash animation disappear
  after about 0.4 seconds. Compare bounce height with jump held and released.
- In Moonlit Gardens, watch mint leaf-eared hoppers rest and jump on a steady beat.
  Stomp one both rising and falling, and approach its side without a shield.
- Collect a cyan shield: see the bubble and SHIELD label with no score change.
  Touch a hopper, walker, or spikes: protection absorbs one hit without losing a
  life or respawning. Leave during recovery; a later hit costs a life. Fall into a
  pit with protection: lose a life anyway. Verify death/completion/restart clear
  protection, consumed pickups stay used after death, and restart restores them.
- Take side damage and hit spikes: lose one life, respawn at the level start with
  brief invulnerability. Confirm falling in a pit still costs a life during that
  invulnerability. On the last life, remain on Game Over.
- Navigate Play, Controls, and Settings with Tab/Shift+Tab, Enter/Space, mouse,
  and touch. Resize to a short phone screen: scroll the menu and reach Back.
  Focus stays inside an open menu and returns to the game when resumed.
- Pause with P or Escape and the on-screen button; resume; switch away from the window and return. Gameplay stays
  paused until resumed, with no stuck movement keys.
- From pause, open Settings or Controls: the player, enemies, score, and level
  timer remain frozen. Test P/Escape with Resume and Pause focused.
- Open Restart level: Cancel and Escape preserve progress. Confirm resets only
  that level and its earned points, while preserving earlier points and lives.
- Change sound effects volume, including zero; the change applies immediately
  and survives reload. Music preference is saved; no music track is included yet.
- Finish a level and verify its collected/total coin count, including coins
  collected before a death. Click Next level rapidly: it advances once.
- Test a phone or touch-enabled device: move and jump together, release controls,
  cancel a touch, pause, and resume. Resize and rotate; controls stay usable.
- Confirm jump, coin, stomp, hurt, completion, and game-over sounds after a user
  gesture. Reload: the best score persists where browser storage is available.
- Build and launch the Windows app using the existing release process. Check the
  same controls and levels, F11 fullscreen, offline operation, and sound.

Do not mark these manual checks passed based on the VM tests. Keep original levels
unchanged if a pre-existing level-design issue is discovered; discuss any layout
change separately before implementing it.
# Stage D visual verification

Stage D adds reference-byte validation, a locked six-level/simulation baseline,
all five heroes × six visual poses, simulation-pure rendering and saved/blocked
reduced-motion settings: **251 Node tests** total. **84 Chromium groups** include
all 30 no-power routes, real before/after captures at five sizes, 30 distinct pose
pixel checks, offline menus and measured rendering. Windows verification builds
the verified Stage C baseline locally for actual before captures and the current
NSIS/portable artifacts for after captures and smoke checks. Neither is published.
Exact-head hosted results, links and remaining human checks live in the draft PR
and [visual guide](visual-redesign.md). Device, audible and formal art acceptance
remain separate human gates.

## Stage E audio verification

Stage E retains all 251 prior cases and adds 17 score/routing/lifecycle/autoplay
cases: **268 Node tests**. **88 Chromium groups** add native music/effects/mute
controls, persistence, retained pause position, eight real two-loop renders,
zero-output mute and overlapping-power/enemy/music signal measurements. Actual
offline Linux and Windows executables run the same audio checks before existing
menu/control/route checks. WAV previews and signal JSON are temporary artifacts.
Audible quality and physical speaker/headphone/device acceptance remain
**NOT TESTED**. See [the audio guide](music-audio.md) and the exact-head draft PR.

## Stage F progression verification

**308 Node tests** retain the previous 268 cases and add 40 validated-save/menu/
selected-level/reset cases. Each existing full campaign recording now checks
earned sequential unlocks. **94 Chromium groups** add a legal earned unlock,
Continue after reload, save isolation, cancel, all five heroes, mandatory boss,
five responsive sizes, simulated touch and blocked storage. Actual offline
executables run the same native progression flows and Windows content-window
resizes. See [progression rules and manual gates](progression.md); human/device
acceptance remains NOT TESTED.

## Stage G final verification

The final branch keeps the verified Stage F game HTML unchanged and extends actual
offline executable replay to **five complete six-level campaigns (30 routes)**,
using normal New Game / Next / Finish with 3510 points and three lives per hero.
It retains **308 Node tests** and **94 Chromium checks**, plus a separate direct
file-URL capability check. Local managed Chromium denied file navigation, so that
additional local case is NOT TESTED; hosted Chromium reports its own result as a
CI notice. HTTP/offline browser and actual Electron `app.asar` file loading are
separate completed checks. Exact-head Windows builds/30-route smoke results,
temporary artifacts and human acceptance are recorded in the verification draft
and [final verification guide](release-verification.md). No merge/release/deployment.
