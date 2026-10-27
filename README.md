# Coin Hopper

**Stage I review checkpoint (Issue #30):** the [isolated Hopper refinement gallery](docs/art/stage-i/concept-review/index.html) compares the approved mascot with a painted single-pose candidate and limited motion study. **Owner approval is required before a replacement atlas or gameplay integration.** Existing five-hero art remains in game. An independent default-OFF Settings preview adds the approved C3 Guardian direction, anatomical vulnerability cues, original stone Foley, a deterministic collapse and persistent non-colliding rubble, plus a working-title composition. Distance-driven feet and responsive picker/Jump repairs apply to existing art without changing movement or maps. See [playtest instructions](docs/stage-i-playtest.md), [C3/native animation evidence](docs/art/stage-i/index.html) and [verification/gaps](docs/stage-i-verification.md). All twelve-level roadmap information below is retained; music A/B and wider artwork rollout remain gated.

**Issue28 owner-playtest follow-up** adds full-width Android landscape layout, clearer picker faces/touch instructions, compact on-button charge/cooldown, tap/hold/release powers, readable2.8s Guardian openings and HP-based pressure. New original level arrangements evolve across Skyline Summit; Settings offers a reversible, default-OFF limited-shot Star Core/pickup trial. See [design and balance decisions](docs/owner-followup-design.md), [coordinated Windows/mobile playtest instructions](docs/owner-followup-playtest.md) and [verification/gaps](docs/owner-followup-verification.md). This branch also contains the [isolated Sunny Meadow original-art prototype](docs/sunny-meadow-prototype.md): Settings → Standard / Illustrated / Illustrated Lite. Standard remains default; Levels2–6 are unchanged and no rollout is authorized.

The adventure is planned for **12levels**. Level6 Stone Guardian is the **midpoint boss** and ends Chapter One; Levels7–12, the true final boss, Team Rally and Windows Enhanced Edition remain future plans, without code in this iteration.


**Stage H is implemented for integrated owner playtesting in [draft PR #27](https://github.com/guardian6b-lgtm/coin-hopper/pull/27).**
It extends all six levels with new platform/coin/encounter sections and attempt-local
retry terraces; adds two-charge **High Jump leaf boots**, a fairer Starry Night crossing,
eight-frame articulated hero locomotion, native touch action buttons, layered dimensional
scenery and illustrated enemies/pickups/abilities. Stone Guardian has three phases with
stone shockwaves, boulders and debris; ordinary builds expose health, not AI commands
or countdowns. All five optional character powers, base movement/hitboxes/scoring,
settings/music and earned unlocks are preserved. The original approved PNG is unchanged.

Use the **[single Windows/Android-browser/iOS-browser playtest guide](docs/stage-h-playtest.md)**
and [Stage H test results, native screenshots and remaining acceptance checks](docs/stage-h-verification.md).
No native APK/IPA, preview deployment or public release is created. Physical devices,
audible quality, art and gameplay balance still need owner acceptance.

The earlier stage descriptions and approved roadmap below are retained as history.
Their map-preservation and two-phase-boss statements apply to those separate branches;
Issue #26 explicitly authorizes Stage H's extensions, Level3 correction and boss rebuild.
High Jump uses the ordinary Jump control (two equal grounded launches, **no double-jump**),
independently of E/Ability. Retry pennants are local to this attempt; Continue/Level Select
still start at a level's beginning with 0 points/3 lives. Coins and defeated enemies do not
regenerate on checkpoint death; Restart rolls back level points before restoring content.

A small self-contained browser platformer. Jump across the levels, stomp enemies, and grab every coin.

Choose Hopper, Minty, Ember, Nova, or Bolt before a new run. Each now has an
optional special ability: **Crown Slam, Vine Snare, Fireball, Star Glide, or
Chain Lightning**. Shared movement, jumps, hitboxes and scoring stay the same;
only an explicitly activated power changes play. Rounded portraits, characters
and power effects are drawn locally on canvas.

This branch adds **Moonlit Gardens**, a fourth level with a crescent moon, glowing
garden scenery, mint leaf-eared hopping enemies, and collectible cyan shields.
Sunny Meadow, Brick Hills, and Starry Night keep their original maps and controls.

**Stage B adds Crystal Caverns, Level 5**, with layered crystal scenery, optional
raised coin paths, armored Shellbacks and charging Crystal Sentinels. All five
heroes can complete it with normal jumps/stomps and no shield or special power.
The original four maps remain unchanged. See [Level 5 design and verification](docs/crystal-caverns.md).

**Stage C completes the six-level campaign with Skyline Summit.** Floating islands,
telegraphed Nightwing dives and a five-HP Stone Guardian finale are implemented on
the stacked Skyline branch. Defeat the Guardian to unlock the final flag; every
hero has a recorded damage-free victory without powers or shields. See
[Skyline Summit and boss verification](docs/skyline-summit.md).

**Stage D implements the reference-driven visual redesign.** The exact approved
PNG is archived with its checksum in [docs/art/reference](docs/art/reference/README.md).
Five locally embedded toy-like mascots have six distinct poses each; wooden panels,
rounded buttons, grassy pedestals, six themed floating-island environments, tiles,
enemy shading, coins, shields and HUD share the new palette. Native menus remain
interactive. Settings adds a saved reduced-motion preference; system reduced motion
also applies. See [visual design, before/after screenshots and verification](docs/visual-redesign.md).

**Stage E adds original looping music.** Title/select, all six scenes and the
Guardian have locally synthesized arrangements, independent music/effects volume,
saved global mute and pause/visibility handling. The score and sounds run offline;
no audio download or CDN is required. Technical signal/mixing tests are distinct
from human listening, which remains open. See [music and audio verification](docs/music-audio.md).

**Stage F adds saved progression.** Play is a new game; Continue and Level Select
begin an unlocked level with **0 points and 3 lives**, then let you choose any hero.
Completing a level saves its unlock immediately. New Game keeps earned unlocks;
saved progress never banks score, lives, pickups or boss damage. Level 6 always
requires a fresh Guardian defeat. See [progression rules and verification](docs/progression.md).

**Stage G records final technical verification.** The verification branch adds
complete five-hero × six-level campaigns inside the actual offline executables,
plus the retained 308-test regression and browser/audio/progression checks.
[Final evidence and human acceptance checklist](docs/release-verification.md)
link the independent draft stack and distinguish automation from physical-device,
audible, art, accessibility and balance acceptance. Nothing from this expansion has
been merged or released.

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

Use Settings to save separate effects and music volumes and **Mute all audio**.
Music starts after your first interaction, pauses with the game or hidden window,
and resumes from its loop position. Restart level asks for confirmation, resets that
level's coins and earned points, and keeps your remaining lives.

Hoppers follow a steady hopping rhythm and award the usual **50 points** when
stomped. A shield absorbs **one enemy or spike hit**, then grants a short recovery
window. A cyan bubble and SHIELD label show active protection. Shields do not
stack, award points, or protect against pits. Protection clears on death, level
completion, and restart. Used pickups stay used after death; restarting the level
restores them. See [the Stage 3 guide](docs/moonlit-gardens.md) for details.

## Stronger enemies — combat foundation

[Issue #10](https://github.com/guardian6b-lgtm/coin-hopper/issues/10), following
[Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6), adds a shared
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
remain intact. Crystal Caverns introduces both types in the campaign. The browser
evidence artifact also includes a separate `enemy-arena.html`
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
| 5 | Crystal Caverns | Implemented in its stacked draft: crystal platforms, armored/ranged enemies, optional bonuses; technical and human review gates recorded separately |
| 6 | Skyline Summit | Implemented in its stacked draft: Nightwing dives and mandatory five-HP Stone Guardian; human acceptance pending |

### Choose Your Hopper — five playable characters

The approved visual direction is a friendly, bright, rounded cartoon-platformer
style with a responsive **Choose Your Hopper** screen. Selection and all five powers
are **implemented in this draft branch**, pending human acceptance and integration.
All characters use the same base running/jumping physics, hitbox, and damage rules;
powers add tactical options only when explicitly activated. They are not available
in the published three-level game. Stronger enemies appear in draft Levels 5–6;
the required Level 6 boss is implemented on the Skyline branch.

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

### Stronger enemies and Level 6 midpoint boss

The first-draft enemy concepts have been approved to balance the new abilities.
**Shellback and Crystal Sentinel appear in Level 5; Skyline Summit adds Nightwing
and the required Stone Guardian boss.** HP and attack timings are **initial playtest targets**,
not locked values. Existing walkers and hoppers stay unchanged.

| Enemy | Proposed HP | Mechanic |
| --- | ---: | --- |
| Walker | 1 | Existing ground patrol; unchanged in original levels |
| Hopper | 1 | Existing timed jumping patrol in Moonlit Gardens |
| **Shellback** | 2 | Implemented in Level 5: visible cracked-shell state after first hit |
| **Nightwing** | 1 | Implemented in Level 6: predictable flight and clearly warned, locked-aim dives |
| **Crystal Sentinel** | 2 | Implemented in Level 5: charges before slow terrain-blocked projectiles |
| **Stone Guardian** | 5 | Implemented Level 6 boss: guarded wind-up, slam/shockwaves, recovery opening and faster phase two |

**Stone Guardian is the approved midpoint encounter at the end of Skyline Summit
(Level 6).** Its fight has a visible health bar, readable wind-up/attack/recovery
windows, a faster second phase, and a one-time defeat effect.
Defeating the Guardian unlocks this chapter’s exit and Chapter One completion. All five
characters must be able to win the battle even **without** special abilities.
No unavoidable attacks, projectile hits through solid terrain, or duplicated
boss-defeat rewards.

See [enemy and boss design, Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6).

### Art, audio and release work

The visual overhaul remains staged in separate drafts. Stage D / Issue #13 adds
the reference-derived characters, all six scene/tile palettes, live rounded menus,
HUD and enemy/effect presentation, plus reduced motion. This artwork is an
interactive game interpretation of the approved reference; formal human art
acceptance is still open. Stage E / Issue #15 implements the original procedural
score, all scene/boss themes, volume/mute, offline operation and mixing protection.
Human listening and hardware output acceptance remain open. Persistent progression
is implemented in Stage F / Issue #16: validated local unlocks, level selection and
Continue from a level beginning. Optional mid-level checkpoints remain deferred;
original maps and death/restart rules are unchanged. Final technical verification
and human acceptance remain Stage G / Issue #14.

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
