# Ember v3.1 controlled locomotion preview

Run from this checkout with Node.js v22.23.5.

```powershell
node scripts/ember-preview.cjs --enable-ember-v31 --port 4174
```

Open the printed IPv4 loopback URL, choose **Play**, select **Ember**, and start the game. The switch is a local launcher flag. With no flag, the launcher serves the ordinary R6-C page. The preview snapshots the page and assets on startup, so restart it after changing preview files. Use a separate browser profile when comparing runs.

The experimental renderer displays exact 1× pixels from four verified transparent FORGE strips. The recorded per-clip foot pivot maps to the current collision box's bottom center. Mirroring uses that same pivot. The nominal 56 px artwork is close to Ember's existing 55–56 px neutral painted extent. The R6-C rig's 48 px value is a normalization, so the asset stays at 1:1 scale.

The four run-start frames use fixed simulation ticks during a normal accelerating start. The run loop enters at frame 11 and advances with resolved grounded travel. During reversal the sprite follows actual travel until the new direction takes over. With no resolved horizontal travel the gait stops. The jump frame selection follows vertical motion and uses the recorded 10 fps interval for the early rise and landing timing. Jump anticipation is skipped so the rise can render on the accepted takeoff tick. Movement, a new jump, and ability poses can interrupt landing or settle.

The ordinary `index.html` and `scripts/preview.cjs` are the verified R6-C files. Only the explicit experiment injects a render observer into its in-memory page. A missing or invalid pack falls back to the ordinary page. A browser image failure leaves all of Ember's sprite frames disabled.

Fireball uses the R6-C charge, release, and recovery art. Phase 2 needs verified effect-free casting body frames and hand anchors, with release aligned to the existing projectile spawn. The FORGE originals remain in the verified backup. Cast, 4× artwork, and master files are outside this preview.

Known art concerns to review in motion include the reported run-start drift, the `run_03` to `run_04` pop, and the direct cut to idle. A switch between the sprite and R6-C Fireball art may also be visible. This preview is for controlled gameplay testing.
