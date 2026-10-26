# Coin Hopper

A small self-contained browser platformer. Jump across the levels, stomp enemies, and grab every coin.

This branch adds **Moonlit Gardens**, a fourth level with a crescent moon, glowing
garden scenery, mint leaf-eared hopping enemies, and collectible cyan shields.
Sunny Meadow, Brick Hills, and Starry Night keep their original maps and controls.

Play the currently published browser game: https://guardian6b-lgtm.github.io/coin-hopper/

> **Release vs. development:** The published `main` game and downloadable Windows
> **v1.0.0** release contain the original three-level experience. Menus/settings
> are under review in [PR #1](https://github.com/guardian6b-lgtm/coin-hopper/pull/1);
> the fourth level, Moonlit Gardens, and its shields/hopping enemies are under
> review in [draft PR #3](https://github.com/guardian6b-lgtm/coin-hopper/pull/3).
> Draft-branch features are **not yet part of the live website or a public download**.

[Windows v1.0.0 installer and portable executable](https://github.com/guardian6b-lgtm/coin-hopper/releases/tag/v1.0.0)
are available from GitHub Releases. Updated Windows downloads are planned after
the expanded game passes testing and review.


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

## Approved expansion roadmap (not yet implemented)

The goal for the next expanded, downloadable edition is **six polished levels**;
10–12 levels are a possible *later* expansion. The original three level layouts,
movement physics, hitboxes, and scoring are the regression baseline.

| Order | Level | Status / intended additions |
| --- | --- | --- |
| 1 | Sunny Meadow | Existing original level; preserve layout |
| 2 | Brick Hills | Existing original level; preserve layout |
| 3 | Starry Night | Existing original level; preserve layout |
| 4 | Moonlit Gardens | Developed in draft PR #3: hopping enemies and one-hit shield; human acceptance pending |
| 5 | Crystal Caverns | **Planned:** armored and ranged enemies and additional challenges |
| 6 | Skyline Summit | **Planned:** flying threats and mandatory Stone Guardian boss battle |

### Choose Your Hopper — five playable characters

The approved visual direction is a friendly, bright, rounded cartoon-platformer
style with a responsive **Choose Your Hopper** screen. All characters will use the
same base running/jumping physics, hitbox, and damage rules; their powers will add
different tactical options. **Character selection and the abilities below are
planned, not currently playable.**

| Character | Appearance | Approved special ability |
| --- | --- | --- |
| **Hopper** | Pink with a gold crown accent | **Crown Slam:** airborne downward impact with an enemy-damaging shockwave |
| **Minty** | Mint green with leaf-like ears | **Vine Snare:** temporarily traps an enemy |
| **Ember** | Orange/coral with a fiery tuft | **Fireball:** launches a fire projectile in the facing direction |
| **Nova** | Purple/indigo with stars | **Star Glide:** slows descent temporarily for controlled aerial movement |
| **Bolt** | Yellow and teal with lightning features | **Chain Lightning:** electric attack that can strike up to two enemies |

Planned common input: **E** on keyboard and a dedicated **Ability** touch button;
existing move/jump/pause keys stay intact. Cooldowns, ranges, enemy damage, score
awards, and animation timing are **provisional pending playtesting**. Each level
must remain completable without using special abilities.

See [character-select design, Issue #4](https://github.com/guardian6b-lgtm/coin-hopper/issues/4)
and [approved abilities, Issue #5](https://github.com/guardian6b-lgtm/coin-hopper/issues/5).

### Stronger enemies and Level 6 final boss

The first-draft enemy concepts have been approved to balance the new abilities;
their HP and attack timings are **initial playtest targets**, not locked values.

| Enemy | Proposed HP | Mechanic |
| --- | ---: | --- |
| Walker | 1 | Existing ground patrol; unchanged in original levels |
| Hopper | 1 | Existing timed jumping patrol in Moonlit Gardens |
| **Shellback** | 2 | Armored enemy: a visible cracked-shell state after first hit |
| **Nightwing** | 1 | Flying patrol with clearly warned dive attacks |
| **Crystal Sentinel** | 2 | Ranged threat that charges before firing slow projectiles |
| **Stone Guardian** | 5 | Required final boss with slam/shockwaves and escalating attack phases |

**Stone Guardian is the approved final encounter at the end of Skyline Summit
(Level 6).** The boss fight is planned to feature a visible health bar, readable
wind-up/attack/recovery windows, a stronger second phase, and a victory sequence.
Defeating the Guardian unlocks the final exit and six-level victory. All five
characters must be able to win the battle even **without** special abilities.
No unavoidable attacks, projectile hits through solid terrain, or duplicated
boss-defeat rewards.

See [enemy and boss design, Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6).

### Art, audio and release work

The proposed visual overhaul will be delivered in stages: character selection,
menu/HUD styling, world tile art and parallax backgrounds, player/enemy/power-up
animations, then original music and effects. Music playback is not implemented;
the settings menu currently saves a *future* music-volume preference on the
development branch.

Browser and Windows installer/portable editions will be verified separately.
GitHub Actions success does not substitute for human difficulty, touch-device,
visible Windows UX or audible music/sound testing. Features move into a public
release **only after approved, tested feature branches are reviewed and merged**.
Never push development directly to `main`.

## Development checks

With Node.js 22 or later, run `node --test` from the repository root. No packages
need to be installed for the gameplay checks. See [the testing checklist](docs/testing.md)
for manual browser, touch, audio, and Windows verification, and [the upgrade plan](docs/upgrade-plan.md)
for the agreed expansion stages.

An optional real Chromium check is available as `node scripts/verify-browser.cjs`
when Playwright is installed. Download the `coin-hopper-browser-preview` artifact
from this branch's Gameplay checks run, unzip, and open `index.html` to play offline.
See [preview instructions](docs/preview.md).
