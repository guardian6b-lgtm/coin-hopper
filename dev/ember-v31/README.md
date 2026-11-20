# Ember v3.1 controlled locomotion preview

Run from this checkout with Node.js v22.23.5.

```powershell
node scripts/ember-preview.cjs --enable-ember-v31 --port 4174
```

Open the printed IPv4 loopback URL, choose **Play**, select **Ember**, and start the game. The switch is a local launcher flag. With no flag, the launcher serves the ordinary R6-C page. The preview snapshots the page and assets on startup, so restart it after changing preview files. Use a separate browser profile when comparing runs.

The experimental renderer uses four verified transparent FORGE strips at 1:1 scale. It mirrors each pose around its recorded foot pivot. Near the left world boundary the renderer eases the entire sprite inward, up to 22.06 px, so the widest mirrored pose fits. This also applies when Ember turns at the wall. The neutral painted height is about 56 px.

The four run-start frames use fixed simulation ticks during a normal accelerating start. The run loop enters at frame 11 and advances with resolved grounded travel. During reversal the sprite follows actual travel until the new direction takes over. With no resolved horizontal travel the gait stops. The jump frame selection follows vertical motion and uses the recorded 10 fps interval for the early rise and landing timing. Jump anticipation is skipped so the rise can render on the accepted takeoff tick. Movement, a new jump, and ability poses can interrupt landing or settle.

The ordinary `index.html` and `scripts/preview.cjs` are the verified R6-C files. Only the explicit experiment injects a render observer into its in-memory page. A missing or invalid pack falls back to the ordinary page. A browser image failure leaves all of Ember's sprite frames disabled.

The opted-in picker temporarily holds Ember's **Start game** button while the four strips decode. Other heroes can start normally, and a failed decode re-enables Start with the R6-C renderer. The preview seeds Ember's idle at spawn, including a restart or respawn, and keeps it through the first passive drop to the floor. Spawn protection and its original flashing still apply. A genuine same-player shield or Core hit continues to use R6-C's hurt art. The gate acts before play begins, and gameplay input still runs through R6-C.

Fireball uses the R6-C charge, release, and recovery art. Phase 2 needs verified effect-free casting body frames and hand anchors, with release aligned to the existing projectile spawn. The FORGE originals remain in the verified backup. Cast, 4× artwork, and master files are outside this preview.

Once grounded horizontal movement stops, Ember settles by retracing the existing run-start poses toward idle. The previous running frame determines the starting pose. Movement and jumping can interrupt this visual recovery immediately.

Run-start keeps the authored pivot. In the native-size Edge comparison a trial subpixel adjustment introduced a one-pixel wobble in the planted foot during acceleration. Foot shape also changes with the authored squash, so a mathematical contact centroid alone is insufficient to judge drift.

The runtime shadow projects onto the nearest exposed solid surface beneath each part of its footprint. It fades and narrows with clearance and clips at platforms, pit lips and world edges. The jump strip itself also contains a small painted gray oval that stays with the feet. Removing it calls for an approved shadow-free export on the same canvases and pivots. The authored bounce from `run_03` to `run_04` also remains visible. The preview retains all sixteen run frames and the existing Fireball art switch.
