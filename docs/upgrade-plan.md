# Coin Hopper upgrade plan

The agreed direction is six levels, varied enemies, shield and coin magnet power-ups,
clearer menus, richer character animation, original music, and gameplay conveniences.
Implement and review one stage at a time. The original three maps and movement feel
are the baseline; introduce expansion mechanics in new maps first.

| Stage | Scope | Review gate |
| --- | --- | --- |
| 1: Protect the baseline | Gameplay regression checks, targeted damage/respawn and enemy cleanup fixes, PR checks | Original maps and movement preserved; focused regressions pass; playtest checklist reviewed |
| 2: Menus and convenience | Play, Controls, Settings, pause actions, restart confirmation, audio settings, completion coin counts | Keyboard, pointer, and touch navigation; pause behavior; saved settings |
| 3: First expansion | Moonlit Gardens, hopping enemy, one-hit shield | Clear introduction; readable enemy; finishable without shield |
| 4: More variety | Crystal Caverns, Skyline Summit, flying patrol enemy, timed coin magnet | Reachable routes; fair combinations; predictable power-up expiration and reset |
| 5: Animation and music | Idle/run/jump/fall/hurt/victory poses, original looping music, pickup feedback, reduced motion | Collision sizes stable; pause/mute respected; offline Windows compatibility |

Stages 1–2 are implemented for review. Their manual browser, audio, touch,
and packaged Windows checks remain pending.
Stages 3–5 are planned and need a scope review before implementation. Checkpoints in
longer new levels remain a balancing decision after the first expansion is playable.
Keep the current cheerful illustrated style.

## Stage 1 boundaries

- Preserve Sunny Meadow, Brick Hills, and Starry Night, including their layout and order.
- Preserve movement acceleration, speed, jump heights, grace period, buffered jumps,
  enemy patrol behavior, scoring values, and three starting lives.
- After damage actually applies, end that simulation step. The respawned character
  begins processing on the next step, and game over cannot be replaced by a win.
- Remove defeated enemies as soon as their squash animation expires. Keep the
  existing 0.4-second animation.
- Exercise the actual game script in Node with browser drawing/audio stubs. Keep
  test hooks out of the shipped page.
- Leave deployment and Windows releases on their existing workflows. Gameplay
  checks upload a standalone browser page for review; they do not publish it.

## Delivery

Use feature branches and reviewable PRs targeting main. Never push changes directly
to main. Each stage should state the behavior changed, test results, and remaining
manual checks. A green automated run is separate from visual, audio, touch, and
packaged Windows playtesting.

See [testing.md](testing.md) for the baseline verification checklist.
