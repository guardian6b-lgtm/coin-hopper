# Character abilities — Issue #5

Implements the [approved specification](https://github.com/guardian6b-lgtm/coin-hopper/issues/5)
on `codex/character-abilities`, stacked on verified character selection
`0c5d0ce3c34094eb57424ba2647c3e49f77c04af` ([draft PR #8](https://github.com/guardian6b-lgtm/coin-hopper/pull/8)).
Issue #4's own branch remains cosmetic-only. This separate change adds one optional
power per character. Human acceptance of both changes is still required.

## Controls and initial balance

Choose Play → character → Start game. Press **E** once or use the dedicated
**Ability** button. No J alias is added. Holding E does not repeat a power, including
after its cooldown expires. Keyboard, mouse and touch all use the same dispatch.
The HUD shows character, power icon/name, readiness and a cooldown progress bar;
Hopper and Nova show **Jump first** when grounded. The button is 104×56 CSS pixels,
separate from movement, Jump and Pause. It moves into the letterbox in portrait.

All distances below are game pixels, independent of canvas display size.

| Character / power | Current playtest default | Limits |
| --- | --- | --- |
| Hopper — Crown Slam | 4s cooldown; downward speed at least 720px/s, normal 900px/s terminal speed; up to 0.6s; landing radius 84px | Airborne only. Solid landing produces a gold shockwave with line of sight to each target. No tile destruction. A normal enemy stomp cancels the slam and retains the original bounce and +50. |
| Minty — Vine Snare | 4s cooldown; 180px facing trace; immobilize one enemy for 2s | First living target only; walls block. Freezes position, velocity integration and hop timer, then resumes. Rooted enemies remain dangerous and stompable. A miss shows the vine but does not spend cooldown. |
| Ember — Fireball | 3s cooldown; 420px range at 420px/s; collision radius 7px | Orange cast, moving flame and impact. Continuous collision stops at solid terrain or the first living enemy. A miss still spends cooldown. |
| Nova — Star Glide | 5s cooldown; 1.5s duration; falling-speed cap 140px/s | Airborne only; no upward force. Steering, ascent gravity and collisions stay normal. Ends on landing or timeout. Pits remain lethal. |
| Bolt — Chain Lightning | 6s cooldown; 240px facing trace; one chain within 110px | Instant cyan zigzag, distinct from the moving fireball. Nearest visible living secondary target; stable enemy order breaks equal-distance ties. Both segments respect walls. At most two defeats. A miss spends cooldown. |

Every ability defeat awards **+50 once**, using the existing defeat animation and
cleanup. Root/glide themselves grant no score. Coins remain +10, stomps +50 and
flags `100 + max(0, 300 - floor(level seconds) * 5)`. Restart still removes only
the restarted level's earned points. Ordinary shield damage still absorbs one
hit; powers grant no invulnerability or pit immunity. Spike/pit damage is resolved
before landing shockwaves so a fatal landing cannot award a post-death kill.

## Lifecycle policy

Cooldowns, active durations, roots, projectiles and power animations advance only
inside the fixed **60 Hz simulation**. Pause, Controls, Settings, restart confirmation
and window blur freeze them. Input is cleared on menu changes; E in menus cannot
queue a later cast. Ability sounds already playing are stopped on pause without
replaying on resume. Each power has distinct locally synthesized effects-volume
audio; muting effects silences all powers. No music or runtime/network assets added.

Death, Game Over, confirmed restart, new run, level completion/transition and return
to title clear roots, active powers, projectiles, power-owned effects/particles and
power sounds, and reset cooldown to **ready**. A shield absorbing a hit preserves
the ongoing power and cooldown because no death occurred. Canceling restart just
resumes frozen state. The selected character persists through these operations;
its existing allowlisted storage preference and safe fallback remain unchanged.

## Implementation boundaries

`ABILITIES` holds configurable defaults and five activation functions. Shared
state and continuous segment/AABB traces enforce cooldown, visibility, collision
and one-time defeats. Roots add a temporary property on existing enemies rather
than replacing their movement code. Rendering remains inline Canvas2D plus native
HUD/button elements. Test-only actor placement stays outside the shipped page.

All four level definitions and recorded route fixtures are unchanged. The shared
26×32 hitbox, default acceleration/speed, jump, gravity, friction, coyote time,
buffer, collision response and shield rules stay intact. Only an intentionally
active slam or glide alters vertical motion. Every character completes every
recorded route without pressing E; no power is required to reach a flag.
Electron product configuration/dependencies and release workflow are untouched.

## Proposed balance review before acceptance

These values are **provisional**, not a claim that human balancing passed. Start
with the approved 4/4/3/5/6s cooldowns and gather playtest evidence before tuning:

- Compare Slam's 84px radius and 4s cooldown with the risk of losing height. If
  repeated safe multi-kills dominate, trial a smaller radius before changing maps.
- Review Snare's 180px horizontal aim, 2s duration and airborne freeze readability.
  A whiff currently retains readiness; decide whether a miss penalty is helpful.
- Compare Fireball's single-hit range with Lightning's shorter two-target burst.
  If Lightning dominates, trial a smaller chain radius or longer cooldown.
- Review Glide's 140px/s cap and 1.5s window for excessively easy shortcuts. Trial
  duration/cooldown changes only after confirming ordinary routes remain intact.
- Check three-finger touch comfort, VFX readability with shields, and actual audio
  loudness/recognition on phones and Windows speakers/headphones.

No additional balance adjustments, level edits or character passives are made here.
See [verification and screenshots](abilities-verification.md) for evidence and gates.
