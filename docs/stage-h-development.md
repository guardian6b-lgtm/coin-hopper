# Stage H development record

Implements owner master [#26](https://github.com/guardian6b-lgtm/coin-hopper/issues/26), with #24/#25, on existing draft #27. Parent `3469a3d78d429faf6385cb85bdecfcc459d1a2b8`; handoff `6e9197aeb7e1e1218df7d1e44e1f60a1c33c34c4`. The Stage G source is retained unchanged in its own branch. No merge/deploy/tag/release authorization.

## Baseline and intended changes

The actual native 960×540 Stage G frame confirms disconnected castle towers. The 30-pose atlas decodes and is used, but the run animation is one static frame plus bob. That is a real animation gap. Boss status narrates internal phases/recovery. All five powers work; no ability rewrite is required. Local Node 24: **308/308 PASS before edits**. Initial hosted handoff Node 22 Linux/Windows checks were green.

Reviewable sequence: High Jump/Level 3 and controls → extended retry terraces and routes → dimensional world/hero/enemy/pickup/ability artwork → three-pattern Guardian → integrated browser/native executable verification and one owner bundle. The approved original PNG remains unchanged.

Baseline authored widths are 76/82/82/108/148/150 columns (2736/2952/2952/3888/5328/5400 px). Proposed expansion adds **96 columns / 3456px** to each: three 32-column authored beats, each with a raised reward route, patrolling encounter, spike crossing, two-tile gap and a safe retry terrace. Six thematic variations retain their identities. Summit's original arena is shifted intact, not duplicated. Original terrain is preserved except the authorized Level 3 correction. Human target for discussion: roughly 2–4 minutes per early level, 3–5 for later levels including exploration/retries, and a 1–2 minute boss. These are **proposed human targets**, not measurements or acceptance claims. Deterministic traversal durations will be recorded separately.

## Fairness, resets and scoring

High Jump leaf boots grant exactly **two grounded/coyote launches at −850px/s** (first simulated vertical step −820), versus the unchanged ordinary −640px/s (first step −610). Each press consumes one charge only when a jump starts; buffered airborne presses do not grant a double-jump. Both boosted launches share gravity and release-to-cut rules; maximum height increases from about 109px to about194px. Hold duration still matters. The two-charge HUD, boots, launch flash and sound communicate state. Powers remain on E/Ability independently.

Level 3's reported 108px row at columns27–29 becomes72px (columns27–28); the third spike becomes blank. Boots at column23 on the safe lower approach are available to every hero. Geometry changes and route scores must be explicitly validated, not compared to stale Stage G checksums.

Pennant terraces are **attempt-local checkpoints**, not banked score saves. Death returns to the latest reached terrace, retains already-collected coins/enemy damage/points, clears transient powers/shield/High Jump and restores only zero-point High Jump pickups. No rewards are regenerated. Restart returns to level start, restores all pickups/enemies and rolls back that level's earned score, preserving lives and prior level points. Existing persisted unlock/character/settings formats are unchanged. Spending both boosts cannot lock progress: the corrected route remains ordinary-jump passable, and death/restart supplies a local retry.

Native CSS-pixel touch controls separate move, jump and Ability, including simultaneous pointer ownership/cancel/blur. Touch labels say Tap/Jump then tap; keyboard E remains. Gameplay stays single-file/offline. Debugging is guarded by source-only `DEVELOPER_DEBUG=false`; ordinary HUD exposes boss identity/HP and defeat only, with no AI states, future commands or countdowns.

## Pending integration

This document is a development record. Final status, exact build checksum, full route measurements, screenshots and human/device gaps are recorded after all integration checks, in the final Stage H report. Physical Android/iOS, audible quality and owner art/balance acceptance cannot be inferred from CI.
