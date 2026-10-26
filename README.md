# Coin Hopper

A small self-contained browser platformer. Jump across the levels, stomp enemies, and grab every coin.

This branch adds **Moonlit Gardens**, a fourth level with a crescent moon, glowing
garden scenery, mint leaf-eared hopping enemies, and collectible cyan shields.
Sunny Meadow, Brick Hills, and Starry Night keep their original maps and controls.

Play it here: https://guardian6b-lgtm.github.io/coin-hopper/

## Controls

- **Move:** Arrow keys or A / D
- **Jump:** Space, Up, or W — hold for a higher jump
- **Pause / resume:** P or Escape, or use the on-screen Pause button
- **Phones:** on-screen touch buttons
- **Menus:** Tab / Shift+Tab to move, Enter or Space to choose, Escape to go back

Use Settings to save separate effects and music volume preferences. Music playback
will arrive in a later upgrade. Restart level asks for confirmation, resets that
level's coins and earned points, and keeps your remaining lives.

Hoppers follow a steady hopping rhythm and award the usual **50 points** when
stomped. A shield absorbs **one enemy or spike hit**, then grants a short recovery
window. A cyan bubble and SHIELD label show active protection. Shields do not
stack, award points, or protect against pits. Protection clears on death, level
completion, and restart. Used pickups stay used after death; restarting the level
restores them. See [the Stage 3 guide](docs/moonlit-gardens.md) for details.

## Development checks

With Node.js 22 or later, run `node --test` from the repository root. No packages
need to be installed for the gameplay checks. See [the testing checklist](docs/testing.md)
for manual browser, touch, audio, and Windows verification, and [the upgrade plan](docs/upgrade-plan.md)
for the agreed expansion stages.

An optional real Chromium check is available as `node scripts/verify-browser.cjs`
when Playwright is installed. Download the `coin-hopper-browser-preview` artifact
from this branch's Gameplay checks run, unzip, and open `index.html` to play offline.
See [preview instructions](docs/preview.md).
