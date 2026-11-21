# Walker Gate B1 development preview

From the project root, start the loopback preview with both accepted R6-D5 art and the Walker experiment.

```
node scripts/ember-preview.cjs --enable-ember-v31 --enable-walker-b1 --port 4174
```

The Walker flag is independent and defaults off. A missing, changed or undecodable strip leaves the ordinary Walker renderer active. The four local PNGs and `strips_meta.json` are byte-for-byte exports from `Walker_Anim_B1_v1.zip` (SHA-256 `8468050f0d1d66df38868a19cf61534a73ced4a278bf43b36761c0025dbe38fe`). The approved still master is Gate A v1.1, frozen as Walker Master v1.0.

Every cell is 44 × 41 with a foot pivot of (21.5, 38.5). The game draws the native frame at the collider's bottom center and mirrors it on turns. The idle loop and both two-frame transitions run at 10 fps. The eight-frame walk covers 14⅔ world pixels per cycle, yielding 30 fps at the stock 55 px/s. Only resolved grounded travel advances the walk cycle. A root settles to idle. A wall or ledge reverses facing on the collision tick. Animation tracks live outside enemy objects and saves.

Gate B1 supplies grounded locomotion. Airborne Walker holds idle frame zero, reduced motion uses the same neutral pose, and a defeated Walker follows the game's existing timed procedural squash. The runtime draws no additional shadow. The accepted right planted-foot slide is 0.537 native pixels.
