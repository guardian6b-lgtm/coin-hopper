# Coin Hopper

**A colorful, family-friendly side-scrolling platform adventure.** Run, jump, collect coins, outsmart enemies, unlock new places, and take on the Stone Guardian. Coin Hopper combines classic 2D platforming with a bright, layered **2.5D-inspired illustrated style**—not a full 3D game.

> **Development status — October 27, 2026:** The expanded six-level **Stage H** game is implemented and has passed automated technical verification, but remains **an unreleased owner-playtest candidate** in [draft PR #27](https://github.com/guardian6b-lgtm/coin-hopper/pull/27). Art direction, difficulty balance, real-device behavior, and human audio testing still require owner acceptance. **The public website and the Windows v1.0.0 release are older three-level builds**, not Stage H.

## The adventure

Choose a hero and work through six themed worlds. Collect coins, navigate hazards, discover shields and temporary upgrades, challenge increasingly varied enemies, and reach each level's goal. In the expanded development build, unlocking a level makes it available through **Continue** and **Level Select**; it does not automatically preserve an earlier attempt's score, lives, or pickups.

| Level | World | Theme |
| --- | --- | --- |
| 1 | **Sunny Meadow** | Bright grassland, platforms, and a castle anchored in the scenery |
| 2 | **Brick Hills** | Brickwork, hilly routes, and layered structures |
| 3 | **Starry Night** | Night-sky platforming, observatory scenery, and a challenging spike crossing |
| 4 | **Moonlit Gardens** | A moonlit garden with hopping enemies and protective shields |
| 5 | **Crystal Caverns** | Crystalline terrain, armored Shellbacks, and Crystal Sentinels |
| 6 | **Skyline Summit** | Floating heights, diving Nightwings, and the **Stone Guardian** finale |

Stage H lengthens all six levels with additional platforming, encounters, rewards, and attempt-local retry checkpoints. Level 3 has a reworked spike approach intended to be fair for every hero.

## Meet the five heroes

All five characters share the same basic running, jumping, collision, and scoring rules. Their **optional** abilities introduce different tactics:

| Hero | Special ability | What it does |
| --- | --- | --- |
| **Hopper** | Crown Slam | An airborne downward strike and shockwave |
| **Minty** | Vine Snare | Temporarily restrains an enemy |
| **Ember** | Fireball | Sends a fiery projectile forward |
| **Nova** | Star Glide | Slows falling for greater control in the air |
| **Bolt** | Chain Lightning | Strikes nearby enemies with electricity |

In Stage H, heroes and enemies have enhanced illustrated effects, dimensional shading, and cycling movement animations. The redesigned **shield** absorbs one eligible hit; the collectible **High Jump leaf boots** provide exactly **two boosted grounded jumps** before expiring. High Jump is **not** a midair double-jump and does not replace a hero's special ability.

## The Stone Guardian

The Level 6 finale is a **three-phase stone-themed encounter** in Stage H, featuring rock-based attacks, boulders, falling debris, and ground shockwaves. Players read attacks from the Guardian's animation and environmental cues. Internal AI state names, recovery countdowns, and upcoming attack labels are **not shown during normal gameplay**. The Guardian must be defeated to complete the campaign.

## Controls

| Action | Keyboard | Touch devices (Stage H) |
| --- | --- | --- |
| Move | Arrow keys or **A / D** | On-screen movement controls |
| Jump | **Space**, **Up**, or **W**; hold for height | **Jump** button |
| Character ability | **E** | **Ability** button |
| Pause / resume | **P** or **Escape** | On-screen **Pause** control |
| Choose menu option | **Tab**, arrows as available, **Enter / Space** | Tap the displayed controls |

Some powers have positional requirements (for example, Hopper and Nova activate theirs in the air). Menu options and exact touch layout may differ between the original public build and Stage H.

## Where to play and test

**Published original build (three levels):**

- [Play the public browser version](https://guardian6b-lgtm.github.io/coin-hopper/)
- [Windows v1.0.0 release — installer and portable executable](https://github.com/guardian6b-lgtm/coin-hopper/releases/tag/v1.0.0)

**Expanded Stage H (six levels; development only):**

- [Draft PR #27 — implementation and verified results](https://github.com/guardian6b-lgtm/coin-hopper/pull/27)
- [Stage H owner playtest guide](https://github.com/guardian6b-lgtm/coin-hopper/blob/codex/stage-h-integrated/docs/stage-h-playtest.md)
- [Stage H verification and screenshots](https://github.com/guardian6b-lgtm/coin-hopper/blob/codex/stage-h-integrated/docs/stage-h-verification.md)
- [Issue #26 — integrated design brief](https://github.com/guardian6b-lgtm/coin-hopper/issues/26)

The Stage H playtest bundles include an HTML game for **desktop browsers and Android Chrome/iOS Safari**, and Windows **installer/portable** builds. Mobile browser testing is **not** a native Android APK or iPhone IPA. For reliable phone testing, the playtest guide explains how to serve the HTML locally over private Wi-Fi. GitHub Actions test artifacts are temporary; links may expire. **Stage H has not been merged, published to Pages, tagged, deployed, or released.**

## Quality and accessibility

The expanded build includes offline-capable bundled art and audio, adjustable sound/music controls, pause support, saved settings and earned level unlocks, and reduced-motion handling. The goal is readable, family-friendly gameplay with recognizable scenery and hazards.

**Automated Stage H results reported at commit [`8f349cf`](https://github.com/guardian6b-lgtm/coin-hopper/commit/8f349cf921f968edf1f22c3f213ae8b108155f40):** 337 Node regression tests, 123 Chromium/WebKit browser checks, and 30 hero/level routes across the supported desktop test configurations passed. These results **do not equal owner approval**. Physical-phone touch behavior, sound quality, art/readability, accessibility, Windows installation experience, and gameplay balance still need hands-on review.

## Development and contributions

The current priority is **one coordinated Stage H owner acceptance playthrough**, followed by focused corrections and a release decision. Work is tracked in draft pull requests so the existing public game is not replaced prematurely. The proposed roadmap beyond the six-level campaign is exploratory, not a release commitment.

For local development and checks, the repository's game tests use **Node.js 22+** with `node --test`. Further browser, Windows, and packaging procedures are documented in the development branch.

**This is a privately directed game project, not an open-source contribution invitation.** Please do not submit external asset/code contributions or redistribute development builds without prior authorization from the project maintainer.

## Copyright, ownership, and permitted use

**Copyright © 2026. All rights reserved.**

Coin Hopper is being developed as a proprietary game. **No open-source license is granted by this repository or README.** Except for rights provided by applicable law, GitHub's Terms of Service, or separate written permission from the applicable rights holder, public repository visibility **does not authorize copying, adapting, republishing, reselling, or distributing project code or original game assets**.

Copyright may protect original code, artwork, music, animation, writing, and other qualifying expression; it does **not** confer exclusive ownership of general platform-game ideas, mechanics, or methods. Character/title branding and trademarks are separate questions. Ownership of every component—especially contributions or third-party/AI-assisted assets—must be confirmed before commercial release. This notice **does not itself establish the identity of the legal copyright owner or substitute for assignments, registrations, or rights clearance**.

Repository maintained by [guardian6b-lgtm](https://github.com/guardian6b-lgtm). For licensing or reuse inquiries, contact the repository maintainer through an appropriate GitHub channel.
