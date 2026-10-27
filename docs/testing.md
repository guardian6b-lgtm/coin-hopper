# Baseline verification

For the stacked character powers, see [ability rules](abilities.md) and the
[135-test, 38-browser-check verification report](abilities-verification.md).
The next stacked phase adds [shared enemy HP and two unplaced prototypes](enemies-phase-one.md);
see its [195-test, 54-browser-check verification](enemies-verification.md).
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
