# Issue28: owner playtest follow-up

Scope: [Issue28](https://github.com/guardian6b-lgtm/coin-hopper/issues/28), based on owner-tested PR27 `8f349cf921f968edf1f22c3f213ae8b108155f40`. PR27 and the approved reference bytes are retained as rollback. Fixes are stacked separately; the Sunny Meadow experiment has a further isolated branch. No merge or publication is authorized.

## Reproduction and P0 repairs

Before844×390, the fixed96px touch reserve and contain-scaled960×540 page left a523px-wide scene. The revised full-width landscape view is844px wide: it crops decorative sky/lower soil, and at short heights shifts the walking surface above52px controls. High routes additionally shift the rendered canvas down as the player climbs, revealing upper platforms that a fixed crop would hide. This display-only framing never changes logical camera size, actor coordinates, collision boxes or physics constants. Portrait keeps contain scaling. Native HUD/controls remain CSS-sized with safe-area insets. Automated emulation does not establish physical notched-device or browser-bar correctness.

The redundant top ability HUD is hidden; the existing Ability control holds charge percentage/ring and cooldown. All unselected picker faces receive a readable front face and balanced eyes over the existing local artwork; selected smiles and gameplay identity remain. Touch instructions omit Tab/E hints. Brick Hills uses connected aqueduct piers/arches instead of detached block dashes.

## Charged powers and midpoint Guardian

Press E/Ability to begin, release to cast. Simulation time only: tap1×,0.4s1.5×,0.8s2×,1.2s3×. Spatial radii/reach scale by square root of strength; raw damage is deliberately bounded. Baseline movement, collision, hitboxes, cooldown table and scoring formulas remain. Pause/blur/rotation/death/restart cancel the held action; pause freezes elapsed cooldowns/effects. Airborne requirements remain: charge on ground if desired, jump, release in air for Hopper/Nova. Missed Minty snare does not invent damage or charge a successful cast.

| Hero | Tier0 /1 /2 /3 |
|---|---|
| Hopper | Damage1/1/2/3, radius84×sqrt(strength); nearest bounds, walls block; one boss HP/opening |
| Minty | Targets1/1/2/3; duration2/2.4/2.8/3.2s; boss root≤2s; no damage |
| Ember | Damage1/1/2/3, larger fireball/reach; splash0/0/28/42px, excludes primary, walls block |
| Nova | Glide1.5/2.25/3/4.5s; same140px/s falling cap, no upward thrust or pit immunity |
| Bolt | Targets2/2/3/4, damage1/1/1/2, scaled reach; visited-set and terrain checks |

Values are centralized in `CHARGE`, `chargedSpec`, `ABILITIES`, `GUARDIAN_ENCOUNTER` and `CORE` for later owner tuning. Walker/Hopper remain1HP; Shellback/Sentinel remain2HP, making a full Ember/Hopper charge useful without inflating every enemy. Stronger tiers remain optional.

**Approved percentage conflict:** five discrete HP cannot express exact quarter thresholds. Keep fiveHP and map remaining5/4/3/2/1 to pressure bands0/0/1/2/3, rocks1/1/2/3/3. Final20% adds bounded mobility/faster pressure. All bands retain2.8s vulnerable recovery, enough for1.2s charge, with green exposed core, parted plates, stagger/hit feedback and sound cue. An accepted hit closes the weak point but does not cut recovery time; one HP per opening prevents multi-hit/charged one-shots. Full unshielded no-power routes for all heroes prove technical reachability, not human combat fairness.

Re-recorded Level6 route uses legal controls only: five hits at frames1928/2232/2545/2791/3068, finish3217. Level6 score685, campaign3755. Longer time lowers the existing time bonus; coin/stomp/defeat/flag formulas are unchanged. The prior owner-reviewed route is archived separately; Levels1–5 fixtures are unchanged. Stone Guardian ends Chapter One (6of12 planned levels), not the full adventure.

## Original score

Level1 and title composer are preserved. Other themes now differ in rhythm, form, timbre and texture: bouncy offbeats (Hills), sparse bells/pads (Night), lilting plucks (Garden), echoed resonances (Cavern), hand-drum-style syncopation (Summit). These are original procedural notes/noise, without borrowed melodies, recordings or samples.

Three32-beat Summit layers share BPM and phase, rising at33/66% of traversal to arena. Backtracking does not reset intensity. The actual AI encounter event sets `bossState.engaged`; position alone cannot prematurely select boss music. Boss overrides traversal, with0.3s crossfades and preserved traversal phase on checkpoint return. Independent volumes/mute/pause/offline remain. WAVs in temporary evidence are listening samples; signal tests do not establish musical quality.

## Reversible Star Core and item-density trial

**Default OFF**, separate Settings opt-in applies next level/restart and uses `coinhopper_prototypes_v1`. Existing character/progression/audio/motion keys are unchanged; blocked or malformed storage falls back OFF. Shared neutral star shots and working name are provisional. Owner must choose final art/input; no choice is inferred from this prototype.

Six ranged shots, F or a small48px contextual button visible only while carried;0.65s shot cooldown, wall collision and finite range. E/Ability remains the charged hero power. No autorepeat or free refill. Empty Core remains carried as one-hit protection. Shield consumes first, then Core on a later eligible hit, with the existing escape invulnerability; pits bypass both. Death/transition clears Core and shots, checkpoint death leaves used pickups consumed. Restart restores pickups while rolling back level points. Fatal hazards resolve before projectile rewards. Boss armor/opening cap still applies.

Actual normal inventory:4shields,7boot pickups across six extended maps. Opt-in trial adds5strategic raised shields and3Core pickups (Levels3/5/6); original boots retained. No coin, enemy, hazard or map geometry is replaced. Default routes and all five heroes need neither new items nor powers. Simulated completion times are not owner playtimes. Density, control clutter, invulnerability pacing and Minty/Nova combat comfort require human testing before promotion to defaults.

## Isolated visual experiment and future scope

Sunny Meadow only: new original illustrated scenery and dimensional terrain treatment, opt-in quality control, reduced-motion/fallback and separate draft PR. Do not propagate to Levels2–6 without owner acceptance. Preserve reference PNG and generated mascot atlas/provenance. Profiles on a desktop runner cannot certify phone60fps, heat or battery.

Roadmap remains12levels;7–12, true final boss, Team Rally limited allies and Windows Enhanced Edition are future work only. No implementation, ownership/branding claim or release is introduced here.
