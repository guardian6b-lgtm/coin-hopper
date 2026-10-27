# Coin Hopper — Issue28 coordinated owner test

This is an unpublished draft candidate, not the live website or old Windows release. `build.json` pins the exact commit; `SHA256SUMS.txt` pins HTML and both EXEs. Packaging version remains1.0.0: identify this candidate by SHA/checksum, never filename/version alone. Temporary CI artifacts expire after7days.

Extract the entire bundle. Windows: run portable EXE, or the NSIS installer for install testing. Both contain the same self-contained HTML. Keyboard: arrows/A/D, Space/W/Up, **hold E then release**, P/Escape; F11 in Electron. Quick E tap retains ordinary power. Hopper/Nova release while airborne. Charge tiers occur at0.4/0.8/1.2seconds; charge/cooldown feedback stays on the small Ability button.

Phones use the exact included `index.html`, not an APK/IPA. Run `node serve-preview.cjs --lan` on a Node22+ computer on the same private Wi-Fi and open the printed private URL in Android Chrome/iOS Safari. Keep computer awake. No hosting/deployment is performed. The helper serves only the page; Ctrl+C stops it. Same IP/port/browser profile preserves origin-local saves. iOS Files Quick Look is not Safari gameplay. Loaded game works disconnected; reload needs the server (no service worker installed). Direct HTML/Electron has all assets offline.

Move+Jump+hold/release Ability together. Test portrait/landscape, cancel/drag off, browser bars/notch, pause/app switch/resume and resizing; look for stuck contacts or hidden hazards. Settings retains original volume/mute/motion controls. Optional **Star Core and pickup trial** defaults OFF: enable, then restart/start next level. Shared star artwork/input are provisional. Collect it in Levels3/5/6, use F or the small contextual six-shot button; hero E stays separate. Shield absorbs before Core, pits kill regardless, death clears it, restart restores pickups and rolls back points.

If this bundle includes the separate Sunny Meadow art prototype, Settings offers **Standard / Illustrated / Illustrated Lite**. Standard remains default; only Level1 changes. Compare844×390 and960×540, reduced motion and long mobile play before requesting any rollout. No other level's artwork is approved by this experiment.

Owner acceptance checklist (record buildSHA/device/browser/date):

- All five readable picker faces, selected smile, touch instructions and start/back/settings/controls; saves survive reload without losing existing progress.
- Larger Android landscape world, clear hazards/feet, unobtrusive cooldown/ring and reliable three/four simultaneous contacts.
- Every hero, all six levels, with and without optional pickups/powers; no score farming after death/restart.
- Guardian green core/pose/audio tells,2.8s recovery, oneHP/opening,1/2/3rocks then aggressive final quarter. Especially test Minty/Nova without Core. Defeat ends Chapter One,6of12 planned levels.
- Tap vs each charge tier, pause/blur/death/restart/rotation cancellation, no surprise fire; non-damaging snare/glide remain useful.
- Listen to included `music-preview/*.wav` and real gameplay at0/mid/full volumes. Judge distinct level identity, Summit33/66% rise and boss transition, loops/mix and fatigue. Programmatic audio checks are not listening approval.
- Compare strategic trial pickup density and Core input clutter; choose shared vs hero-themed projectile direction before final artwork.
- Windows physical keyboard/F11/Alt-Tab/DPI/settings/offline; optional installer/uninstaller/security/shortcuts. Android and iOS actual touch/safe-area/browser-bar/audio/long-session heat/battery/60fps remain manual.

Technical evidence and unresolved gaps: `docs/owner-followup-verification.md`. This package requests playtesting; it does not infer acceptance or authorize merges, deployment, tags or releases.
