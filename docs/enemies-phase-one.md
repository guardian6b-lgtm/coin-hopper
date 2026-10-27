# Stronger enemies, Phase 1 — Issue #6

Implements the shared combat foundation, Shellback and Crystal Sentinel from
[Issue #6](https://github.com/guardian6b-lgtm/coin-hopper/issues/6) on
`codex/enemy-balance`, stacked on verified ability head
**`9736d908738692411eff1ea27c58d858fb224a7e`** ([draft PR #9](https://github.com/guardian6b-lgtm/coin-hopper/pull/9)).
The dependency's 135 tests passed again before modification. No new enemy markers
or placements are added to Sunny Meadow, Brick Hills, Starry Night or Moonlit
Gardens. Nightwing, Stone Guardian, Levels 5/6 and the full world-art overhaul are
future stages. README preserves the approved plans from separate draft PR #7;
that PR and all parent branches remain unmerged and unchanged.

## Shared combat and initial values

`createEnemy(type,x,y)` initializes `health`/`maxHealth` and physical/attack state.
The existing `e` and `h` map markers still create walkers/hoppers at exactly the
same locations, dimensions, velocities and hop timing. Walker's existing omitted
`type` convention is retained. No new map markers are introduced in this phase.

`damageEnemy(enemy,source,color)` is the sole HP-aware path for stomps, Crown Slam,
Fireball and Chain Lightning. Each accepted hit removes **one HP**. A surviving
enemy gets a 0.3s repeat-hit guard, a 0.18s white flash and a short impact effect.
No points are awarded for an armor hit. Defeat marks the actor dead, clears roots
and its owned shots, grants **+50 exactly once**, and uses the original 0.4s squash
cleanup. Fallen enemies grant no score. Legacy coin/stomp/flag rewards stay intact.

| Type | HP | Body | Movement / attack defaults |
| --- | --- | --- | --- |
| Walker | 1 | 28×28 | Existing 55px/s patrol; one-hit +50 defeat |
| Hopper | 1 | 28×28 | Existing 55px/s patrol, first hop 0.7s, repeat 0.95s, upward speed 420px/s |
| Shellback | 2 | 34×28 | 40px/s patrol; reverses at solid walls and ledges; no protected front |
| Crystal Sentinel (`sentinel`) | 2 | 30×36 | Stationary; first-ready delay 1.2s, 0.8s wind-up, 2.4s recovery after release, acquire within 300px |

Sentinel locks its aim at the **start** of the visible wind-up. The gold warning
ring, dashed direction and exclamation mark remain visible while charging. The
pink/lavender crystal travels at **130px/s**, radius **6px**, for at most **3s**;
it does not home or track. Shots leaving the view plus a one-tile margin despawn,
including when the camera moves away. Acquisition requires clear terrain line of sight for
the shot radius. Continuous segment collision stops both slow and fast shots at
solid terrain; walls win exact collision ties with the player. Offscreen charging
is canceled rather than releasing an unseen attack. At most 32 hostile shots can
exist. These parameters live in frozen `ENEMY_TYPES`, `ENEMY_COMBAT` and
`ENEMY_DAMAGE` tables beside the existing configurable `ABILITIES` table.

Shellback has a bronze segmented shell, green feet and a jagged visible crack
after its first hit. Sentinel has a faceted blue crystal body and charging cue.
Both show two small health pips. The player retains the original **26×32** body,
speed, acceleration, friction, gravity, jumps, coyote time, buffer and collisions.
Neither new type is front-invulnerable or immune to any character's stomp.

## Abilities and shields

- Crown Slam, Fireball and Lightning deal one HP per target, rather than defeating
  armored targets outright. Fireballs still stop at the first target even if its
  repeat-hit guard rejects damage. Lightning hits at most two distinct targets;
  its surviving first target cannot be selected again by the chain.
- The repeat-hit guard prevents a fireball followed by a same-frame stomp from
  removing both HP. A protected stomp still produces the original -380/-560 bounce
  without another armor hit. The guard protects the enemy's HP; ordinary side
  contact remains dangerous and grants no new player invulnerability.
- Vine Snare immobilizes either type for the existing 2s without damage or points.
  It freezes a Sentinel's movement and attack timer; previously fired shots continue
  normally. After release, the stored wind-up/cooldown resumes with its original
  locked aim. Rooted enemies remain dangerous and stompable.
- Star Glide retains its existing falling-speed cap, steering, terrain collision
  and stomp bounce. It gives no flight, shot immunity or pit immunity.
- One shield absorbs one hostile projectile with the existing recovery window.
  A colliding shot is consumed even during player recovery; simultaneous shots
  cannot drain multiple lives. A damaging hit ends that update before a flag award.

## Pause and reset policy

All enemy timers, hit flashes, roots and projectiles use the fixed **60 Hz**
simulation. Pause, Settings, Controls, restart confirmation and blur **freeze**
their state. Resume continues it; canceling restart never heals an enemy or erases
a pending attack. Enemy tones already playing stop on pause without replaying.
New sounds use the existing effects-volume gain; no music or remote asset is added.

Death/Game Over, confirmed restart, level completion/transition, new run and title
clear hostile shots, wind-up/aim, enemy-owned particles and hit timers. Death
**preserves health damage and defeated actors**, like existing collected coins
and enemy defeats; it does not silently heal armor or allow score farming. A live
Sentinel restarts its first-ready delay. A shield absorbing a shot does not perform
death cleanup. Restart/new run reloads the level with fresh actor health, pickups
and level scoring according to the existing policy. The current four levels still
reload only their original one-hit enemies. Defeating a Sentinel removes its own
shots immediately, while another live Sentinel's shots remain intact.

## Isolated review arena and human checks

Download **enemy-phase-one-browser-evidence** from this PR's Gameplay checks run.
Extract and open `enemy-arena.html` for the explicit **test arena**. Choose a hero
using the normal menu, then use the Reset Shellback / Reset Sentinel buttons to
try either enemy with fresh score/lives/health. Native Restart also resets this
artifact-only arena. All normal move/jump/Ability controls work; use title to choose
another hero. These reset helpers exist only in the generated review copy.

`index.html` in the artifact is the unchanged campaign content with the new combat
code but **no new enemy placements**. The review arena is a temporary plain floor
using existing Moonlit Gardens scenery, not a new fifth level or a modified fourth
map. It is generated from the current game plus `scripts/enemy-fixture.cjs` by
`scripts/enemy-preview.cjs`; neither helper is imported by the product page or
packaged into Electron. Browser checks exercise it through HTTP and offline HTML
execution with network disabled. A file:// browser policy may require a local
server. The Windows package checks exercise the same actors using controlled
runtime fixtures without modifying the packaged page.

Human balance remains **NOT TESTED**. Check shell-crack/health readability at small
screen sizes, Sentinel wind-up and aim clarity, two-hit stomp safety, snare release,
glide dodges, damage feedback while guarded, three-finger comfort, audible volume
and actual device frame pacing. Trial values only after gathering evidence: a longer
wind-up or slower shot if warnings are too hard to read; patrol speed, range and
recovery if attacks are too trivial/frequent. Keep +50 defeats and original maps,
physics and routes unless a separate change is approved. Stronger enemy placement
and Level 5/6 difficulty require a later review.

See [verification and screenshots](enemies-verification.md).
