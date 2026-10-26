# Coin Hopper

A small self-contained browser platformer. Jump across the levels, stomp enemies, and grab every coin.

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

## Development checks

With Node.js 22 or later, run `node --test` from the repository root. No packages
need to be installed for the gameplay checks. See [the testing checklist](docs/testing.md)
for manual browser, touch, audio, and Windows verification, and [the upgrade plan](docs/upgrade-plan.md)
for the agreed expansion stages.
