# Ember v3.1.1 controlled visual continuity preview

Run from this checkout with Node.js v22.23.5.

```powershell
node scripts/ember-preview.cjs --enable-ember-v31 --port 4174
```

Open the printed IPv4 loopback URL, choose **Play**, select **Ember**, and start the game. The switch is a local launcher flag. With no flag, the launcher serves the ordinary R6-C page. The preview snapshots the page and assets on startup, so restart it after changing preview files. Use a separate browser profile when comparing runs.

The experimental renderer uses four verified transparent FORGE strips at 1:1 scale. It mirrors each pose around its recorded foot pivot. Near the left world boundary the renderer eases the entire sprite inward, up to 22.06 px, so the widest mirrored pose fits. This also applies when Ember turns at the wall. The neutral painted height is about 56 px.

The four run-start frames use fixed simulation ticks during a normal accelerating start. The run loop enters at frame 11 and advances with resolved grounded travel. During reversal the sprite follows actual travel until the new direction takes over. With no resolved horizontal travel the gait stops. The jump frame selection follows vertical motion and uses the recorded 10 fps interval for the early rise and landing timing. Jump anticipation is skipped so the rise can render on the accepted takeoff tick. Movement, a new jump, and ability poses can interrupt landing or settle.

The ordinary `index.html` and `scripts/preview.cjs` are the verified R6-C files. Only the explicit experiment injects a render observer into its in-memory page. A missing or invalid pack falls back to the ordinary page. A browser image failure leaves all of Ember's sprite frames disabled.

The opted-in picker temporarily holds Ember's **Start game** button while the four strips decode. Other heroes can start normally, and a failed decode re-enables Start with the R6-C renderer. The preview seeds Ember's idle at spawn, including a restart or respawn, and keeps it through the first passive drop to the floor. Spawn protection and its original flashing still apply.

In the R6-D5 picker, Ember's portrait uses idle frame 0 from the same decoded image as gameplay. Its 43 × 61 cell keeps its (14.94, 58.84) foot pivot. The card shows a loading message until the whole pack is ready. A decode failure labels the playable procedural portrait **Standard artwork**. Selection changes the card border and check mark while the portrait holds its pose.

Hopper, Minty, Nova and Bolt use their current gameplay idle rigs. FORGE's later Minty, Nova and Bolt still masters await playable animation and integration. Hopper's separate review imagery also stays outside the picker. The five native buttons retain the game's existing arrow, Home, End and Tab navigation. **Start game** confirms and saves the selected hero.

R6-D4 uses temporary poses from the approved movement strips. At rest Ember holds run-start frame 0 while charging, frame 2 on release and cast, then frame 1 in recovery. During travel he keeps the gait or airborne frame and faces the Fireball direction. The queued release can paint before the next tick. Only the game creates a projectile.

A shield or Star Core hit uses the landing squash (jump frame 5) on the ground or the tucked jump (frame 2) in the air. After the first 0.15 seconds of immunity, movement uses the usual travel frames. A stationary grounded Ember keeps the squash until protection expires. The existing flash and reduced-motion setting still apply. Losing a life starts the new player's normal spawn idle.

The eight FORGE casting candidates have a painted Fireball and a fixed 900 ms sequence. Dedicated casting needs effect-free body frames, an interruptible charge hold, and hand anchors for both facings aligned to the game's immediate release. Dedicated grounded and airborne damage poses also await FORGE artwork and owner approval.

Once grounded horizontal movement stops, Ember settles by retracing the existing run-start poses toward idle. The previous running frame determines the starting pose. Movement and jumping can interrupt this visual recovery immediately.

Run-start keeps the authored pivot. In the native-size Edge comparison a trial subpixel adjustment introduced a one-pixel wobble in the planted foot during acceleration. Foot shape also changes with the authored squash, so a mathematical contact centroid alone is insufficient to judge drift.

The runtime shadow projects onto the nearest exposed solid surface beneath each part of its footprint. It fades and narrows with clearance and clips at platforms, pit lips and world edges. The v3.1.1 art correction supplies seven shadow-free jump poses and adjusts the painted face on `run_03` and `run_04`. The manifest records the SHA-256 of the original v3.1 archive and the correction ZIP. Only the two verified 1× run and jump strips from the correction are loaded alongside the original idle and run-start strips.
