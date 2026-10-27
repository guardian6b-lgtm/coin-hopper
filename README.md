# Coin Hopper

A small self-contained browser platformer. Jump across the levels, stomp enemies, and grab every coin.

Choose Hopper, Minty, Ember, Nova, or Bolt before a new run. Each now has an
optional special ability: **Crown Slam, Vine Snare, Fireball, Star Glide, or
Chain Lightning**. Shared movement, jumps, hitboxes and scoring stay the same;
only an explicitly activated power changes play. Rounded portraits, characters
and power effects are drawn locally on canvas.

This branch adds **Moonlit Gardens**, a fourth level with a crescent moon, glowing
garden scenery, mint leaf-eared hopping enemies, and collectible cyan shields.
Sunny Meadow, Brick Hills, and Starry Night keep their original maps and controls.

Play the currently published browser game: https://guardian6b-lgtm.github.io/coin-hopper/

> **Release vs. development:** The published `main` game and downloadable Windows
> **v1.0.0** release contain the original three-level experience. Menus/settings
> are under review in [PR #1](https://github.com/guardian6b-lgtm/coin-hopper/pull/1);
> the fourth level, Moonlit Gardens, and its shields/hopping enemies are under
> review in [draft PR #3](https://github.com/guardian6b-lgtm/coin-hopper/pull/3).
> Character selection is implemented in [draft PR #8](https://github.com/guardian6b-lgtm/coin-hopper/pull/8),
> and all five powers are implemented on this branch in [draft PR #9](https://github.com/guardian6b-lgtm/coin-hopper/pull/9).
> Draft-branch features are **not yet part of the live website or a public download**.

[Windows v1.0.0 installer and portable executable](https://github.com/guardian6b-lgtm/coin-hopper/releases/tag/v1.0.0)
are available from GitHub Releases. Updated Windows downloads are planned after
the expanded game passes testing and review.

## Controls

- **Move:** Arrow keys or A / D
- **Jump:** Space, Up, or W — hold for a higher jump
- **Ability:** E or the separate on-screen Ability button. Hopper and Nova must
  be airborne. The compact skill HUD shows readiness and cooldown.
- **Pause / resume:** P or Escape, or use the on-screen Pause button
- **Phones:** on-screen touch buttons
- **Menus:** Tab / Shift+Tab to move, Enter or Space to choose, Escape to go back
- **Characters:** Play → Choose Your Hopper → Start game. Tap/click a card, or use
  Left/Right (Home/End for first/last), then Tab to Start game. Back/Escape cancels.

Start game saves your confirmed character where browser storage is available.
Missing, invalid, or blocked storage safely defaults to Hopper. Death, restart,
level changes, and Try again keep your character. Controls and Settings remain
available; they never change a running game's character. See the
[character-selection foundation](docs/character-select.md). Issue #4 stays
cosmetic-only on its own branch; this stacked Issue #5 branch adds the powers.
See [ability rules and provisional balance](docs/abilities.md) and
[the PASS / FAIL / NOT TESTED report](docs/abilities-verification.md).

Use Settings to save separate effects and music volume preferences. Music playback
will arrive in a later upgrade. Restart level asks for confirmation, resets that
level's coins and earned points, and keeps your remaining lives.

Hoppers follow a steady hopping rhythm and award the usual **50 points** when
stomped. A shield absorbs **one enemy or spike hit**, then grants a short recovery
window. A cyan bubble and SHIELD label show active protection. Shields do not
stack, award points, or protect against pits. Protection clears on death, level
completion, and restart. Used pickups stay used after death; restarting the level
restores them. See [the Stage 3 guide](docs/moonlit-gardens.md) for details.

## Stronger enemies — Phase 1 (implemented for isolated review)

[Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6) adds a shared
health/damage system and two enemy types on `codex/enemy-balance`:

- **Shellback:** 2 HP, slower armored patrol, with a visible cracked shell after
  the first hit.
- **Crystal Sentinel:** 2 HP, a visible 0.8-second wind-up and locked aim before
  firing a slow, dodgeable crystal projectile. Solid terrain stops its shots.
- Stomps, Crown Slam, Fireball and Chain Lightning each deal one HP. Vine Snare
  immobilizes both types and freezes Sentinel attack timing; Star Glide retains
  normal stomp/collision behavior. Every character can defeat either by stomping.
- The first armor hit gives no points; a defeat awards **+50 once**. A short
  per-enemy repeat-hit guard prevents simultaneous attacks from double-damaging.
  Existing walkers/hoppers remain one-hit enemies with unchanged rewards.

**Neither new enemy is placed in Levels 1–4.** All four maps and no-power routes
remain intact. The browser evidence artifact includes a separate `enemy-arena.html`
review fixture with character selection and Reset Shellback / Reset Sentinel
buttons. It is not a campaign level or part of the shipped browser/Electron page.
See [enemy rules and initial balance](docs/enemies-phase-one.md) and the
[PASS / FAIL / NOT TESTED report with screenshots](docs/enemies-verification.md).

## Approved expansion roadmap and implementation status

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
style with a responsive **Choose Your Hopper** screen. Selection and all five powers
are **implemented in this draft branch**, pending human acceptance and integration.
All characters use the same base running/jumping physics, hitbox, and damage rules;
powers add tactical options only when explicitly activated. They are not available
in the published three-level game. No stronger enemies or boss are added here.

| Character | Appearance | Implemented ability on this draft branch |
| --- | --- | --- |
| **Hopper** | Pink with a gold crown accent | **Crown Slam:** airborne downward impact with an enemy-damaging shockwave |
| **Minty** | Mint green with a leafy sprout | **Vine Snare:** temporarily traps an enemy |
| **Ember** | Orange/coral with a fiery tuft | **Fireball:** launches a fire projectile in the facing direction |
| **Nova** | Purple/indigo with stars | **Star Glide:** slows descent temporarily for controlled aerial movement |
| **Bolt** | Yellow and teal with lightning features | **Chain Lightning:** electric attack that can strike up to two enemies |

Implemented common input: **E** on keyboard and a dedicated **Ability** touch button;
existing move/jump/pause keys stay intact. Power cooldowns, ranges and animation
timing are **provisional pending human playtesting**. Ability defeats award the
existing **+50 once**; original coin, stomp and flag scoring stay unchanged. Initial
cooldowns are Hopper 4s, Minty 4s, Ember 3s, Nova 5s and Bolt 6s, centralized with
ranges/durations in `ABILITIES`. Each level must remain completable without using
special abilities.

See [character-select design, Issue #4](https://github.com/guardian6b-lgtm/coin-hopper/issues/4)
and [approved abilities, Issue #5](https://github.com/guardian6b-lgtm/coin-hopper/issues/5).

### Stronger enemies and Level 6 final boss

The first-draft enemy concepts have been approved to balance the new abilities.
**Shellback and Crystal Sentinel mechanics are implemented in isolation in this
phase; their campaign placements remain planned. Nightwing and the Stone Guardian
boss are not implemented.** HP and attack timings are **initial playtest targets**,
not locked values. Existing walkers and hoppers stay unchanged.

| Enemy | Proposed HP | Mechanic |
| --- | ---: | --- |
| Walker | 1 | Existing ground patrol; unchanged in original levels |
| Hopper | 1 | Existing timed jumping patrol in Moonlit Gardens |
| **Shellback** | 2 | Implemented mechanic, not placed: visible cracked-shell state after first hit |
| **Nightwing** | 1 | Planned flying patrol with clearly warned dive attacks |
| **Crystal Sentinel** | 2 | Implemented mechanic, not placed: charges before slow terrain-blocked projectiles |
| **Stone Guardian** | 5 | Planned required final boss with slam/shockwaves and escalating attack phases |

**Stone Guardian is the approved final encounter at the end of Skyline Summit
(Level 6).** The boss fight is planned to feature a visible health bar, readable
wind-up/attack/recovery windows, a stronger second phase, and a victory sequence.
Defeating the Guardian unlocks the final exit and six-level victory. All five
characters must be able to win the battle even **without** special abilities.
No unavoidable attacks, projectile hits through solid terrain, or duplicated
boss-defeat rewards.

See [enemy and boss design, Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6).

### Art, audio and release work

The visual overhaul is staged: character selection, rounded character artwork and
initial menu/HUD styling are implemented in drafts #8/#9, including ability effects,
animations and sounds. The complete world tile/parallax overhaul, broader
player/enemy/power-up animations and original music remain planned. Music playback
is not implemented; the settings menu currently saves a *future* music-volume preference on the
development branch.

Browser and Windows installer/portable editions are verified separately; current
automated results and remaining gates are in the [ability report](docs/abilities-verification.md)
and [draft PR #9](https://github.com/guardian6b-lgtm/coin-hopper/pull/9).
GitHub Actions success does not substitute for human difficulty, touch-device,
visible Windows UX or audible music/sound testing. Features move into a public
release **only after approved, tested feature branches are reviewed and merged**.
Never push development directly to `main`.

Roadmap context is preserved from [draft PR #7](https://github.com/guardian6b-lgtm/coin-hopper/pull/7);
that documentation PR remains separate and unmerged.

## Development checks

With Node.js 22 or later, run `node --test` from the repository root. No packages
need to be installed for the gameplay checks. See [the testing checklist](docs/testing.md)
for manual browser, touch, audio, and Windows verification, and [the upgrade plan](docs/upgrade-plan.md)
for the agreed expansion stages.

An optional real Chromium check is available as `node scripts/verify-browser.cjs`
when Playwright is installed. Download the `coin-hopper-browser-preview` artifact
from this branch's Gameplay checks run, unzip, and open `index.html` to play offline.
See [preview instructions](docs/preview.md).
