# Stage H — Integrated Implementation Handoff (owner authorized 2026-10-27)

**Source of truth:** [Issue #26](https://github.com/guardian6b-lgtm/coin-hopper/issues/26). Read it fully alongside [#24](https://github.com/guardian6b-lgtm/coin-hopper/issues/24) and [#25](https://github.com/guardian6b-lgtm/coin-hopper/issues/25).

**Stage G parent:** draft [PR #23](https://github.com/guardian6b-lgtm/coin-hopper/pull/23), branch `codex/release-verification`, verified head `3469a3d78d429faf6385cb85bdecfcc459d1a2b8`. The Stage H branch is `codex/stage-h-integrated`. Do **not** modify Stage G, release branches, or `main`. Verify parent head before rebasing or integrating.

## Owner's confirmed actual playtesting
- All six levels unlock and all five hero abilities function. Do not regress them or call powers broken.
- Level 3's raised spike crossing was reasonably cleared only by Nova with glide, not with other heroes on touchscreen.
- Heroes appear to glide sideways with insufficient real walk/run animation.
- Levels 1–6 are too short and backgrounds lack coherent dimensional detail; Level 1 castle appears as floating pink rectangles with triangle roofs.
- The shield item reads as a generic ticked shield icon rather than a believable world pickup.
- Enemies and abilities need stronger personality, coherent cartoon depth and dynamic effects.
- Stone Guardian is crude and laser-like projectile visuals mismatch a stone entity. Visible attack-state/recovery labels and countdown spoil the encounter.

## Visual goal
**2.5D aesthetic, 2D side-scrolling play**. Illustrated, detailed family-friendly environments, readable silhouettes, parallax, textured and shaded forms, believable anchoring/perspective and controlled particle/ability VFX. Retain familiar hero identities and quality between picker and native-sized gameplay. Do not imitate copyrighted game art or migrate to a 3D engine.

## Work sequence: keep changes reviewable, deliver one integrated human playtest
1. **Diagnostic baseline:** Reproduce issue #25's Level 3 crossing and hero run animation gap; record exact map/timing/sprite/render assumptions, before captures at native sizes and test baseline. Survey all six maps, enemy sprites, pickups, boss rendering/state UI and current performance.
2. **Touchscreen fair play:** Implement a new **High Jump pickup** granting *two separate equal-strength enhanced grounded jumps*; decrement charge only on successful initiation; no midair double-jump, no extra phone button. All five heroes can collect it. Add readable charge/status indicators; recovery after mistake through restart/checkpoint replenishment, never game-wide restart or a soft lock. Place before difficult crossing, especially Level 3. Test full route and if still unfair make minimal spike/landing geometry correction. Keep other hero special abilities functioning unchanged. Improve tap-target clarity of already-working mobile Ability button and multi-touch input.
3. **Character and enemy motion:** Actual cyclical running/walking frames at game scale for every hero, with idle/jump/fall/hurt/land/defeat/victory consistency, left/right orientation and reduced-motion behavior. Enhance Shellback, Sentinel and Nightwing motion/attack reactions without obscure unreadable hitboxes.
4. **World/environment art + length:** Visually rebuild Level 1 castle so it looks like a grounded castle, not floating rectangles. Apply coherent layered/illustrated lighting, textures, geometry and visual depth across all six distinct environments. Expand each level with purposeful obstacles, collectibles, enemy encounters and the taught High Jump usage; avoid filler. Measure lengths, traversal pacing and hazard fairness. Optimize mobile draw budgets.
5. **Pickup/ability visual upgrades:** Fully illustrate shield and High Jump pickups and distinct ability VFX for Minty/Ember/Nova/Bolt/Hopper. Clarify active, cooldown and impact feedback without obscuring threats.
6. **Stone Guardian overhaul:** Sculpt convincing multi-part stone body with animated heavy movement; swap generic laser-orbs for boulders/stone fragments/ground shockwaves/debris, with fair terrain-based telegraphs; create varied, ideally three escalating attack phases. **Remove all boss next-move strings, recovery countdowns, AI command/debug labels from normal player UI**; guard diagnostics behind opt-in debug mode disabled in shipped playtest. Use animation/audio, not command labels, to convey attack warnings.
7. **Integrate and test:** Run all relevant original regression checks, updated map/score fixtures with explicit reasons for changes, all **5 heroes × 6 levels** (ordinary physics, abilities and new pickup cases), file/offline Electron, browser, iPhone/Android-sized touch emulation, multitouch, pause/rotation, reduced motion, score/progression/audio and boss HUD privacy. Mark physical-device checks **NOT TESTED** until owner validates. Measure performance, do not assume CI FPS equals phone FPS.
8. **Deliver ONE consolidated owner playtest:** playable standalone HTML for Windows browser/Android browser/iOS browser with accurate platform instructions, exact commit SHA+hash, screenshot/animation comparisons at true display sizes, release-blocking test report. If an HTTPS staging origin is desirable, submit deployment plan for explicit approval; **do not deploy**.

## Acceptance and guardrails
- Issue #26 is authoritative when old #24/#25 constraints conflict with the owner's newer level-expansion, power-up and boss authorizations. Keep original art reference PNG unchanged unless specifically approved; document generated art provenance/manifest.
- Keep initial Stage G reference intact for objective before/after testing.
- Break implementation into commits that can be reviewed/reverted; do not open parallel conflicting branches. This is a **work-start / planning commit only**, not evidence that product features have been fixed yet.
- **No merge, release, tag, public or private deployment or direct main push.** Leave as draft pending owner acceptance.

## Codex first action
Read the complete issue and existing code, report baseline defects, propose a small concrete file-by-file implementation sequence, **then begin the Stage H code changes on this branch**. Do not stop after rewriting a plan; deliver working features and evidence before declaring completion.
