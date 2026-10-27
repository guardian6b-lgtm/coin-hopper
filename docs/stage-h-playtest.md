# Coin Hopper Stage H — one integrated owner playtest

This is the **draft PR #27 / `codex/stage-h-integrated`** build, not the published Pages game or Windows v1.0.0 release. Use this bundle for the coordinated six-level review. Nothing is deployed, tagged, merged or released.

## Identify the build

`build.json` identifies the exact Git commit and CI run. `SHA256SUMS.txt` identifies the two Windows executables and the standalone `index.html`. The Windows application's embedded HTML is checked against this very same source before building. Do not mix an older HTML/EXE with this bundle. The packaging version remains the existing 1.0.0 because this is an unpublished test; use the commit/checksum to identify Stage H.

Expected standalone page SHA-256:
`8f3c96f48576b0924362dff6dafd43eaec27b740bd2a205df59e04ae54db71da`.

On Windows verify: `Get-FileHash .\index.html -Algorithm SHA256` (similarly for each EXE). Compare with the bundled checksums. Temporary artifacts expire seven days after creation; they are not public releases.

## Windows

Extract the entire artifact ZIP. Start with the portable `Coin Hopper 1.0.0.exe`, or use `Coin Hopper Setup 1.0.0.exe` if specifically testing installation. Open `index.html` in current Chrome/Edge for the identical browser game. The Electron app is offline: all art, music and simulation are bundled. First click/tap enables audio. Use A/D or arrows, Space/W/Up, E, Escape/P and F11 in Electron. Continue/Level Select retain earned unlocks and start a new attempt; settings/hero storage is preserved. Browser file storage and Electron storage are separate origins.

Actual Windows CI launch/window/persistence tests are automated. Human installation/uninstallation, shortcuts, security prompts, physical input, speakers, DPI and frame pacing remain manual.

## Android Chrome and iPhone/iPad Safari

This HTML is **not an APK/IPA**. Android local-file execution varies by file provider/browser; iOS Files Quick Look is not Safari gameplay. For a reliable same-origin browser test, serve the exact included HTML on a computer on the **same private Wi-Fi**:

1. With Node.js22+ installed on the computer, in the extracted bundle run `node serve-preview.cjs --lan`. In a source checkout use `node scripts/serve-stage-h.cjs --lan`.
2. It prints a private phone URL such as `http://192.168.1.20:8080/`. Open that in Android **Chrome** or iOS **Safari**, not an in-app document preview. The computer must remain on. If its OS asks about a private-network firewall exception, review that locally; no firewall or router settings are changed by this project. Don't configure router port forwarding or use public Wi-Fi.
3. Alternatively, if Python 3 is already installed: `python -m http.server 8080 --bind 0.0.0.0` from a folder containing **only this playtest bundle**, then use the computer's private IPv4 address. That general-purpose server exposes that folder; the included Node helper serves only the game page.
4. Rotate to landscape for the largest game view; portrait still has independent CSS-pixel touch controls. Tap Start, then move/jump/**✦ Ability**. Hold Jump for higher jumps. Move + Jump + Ability supports overlapping contacts. Hopper/Nova require being airborne; tap Ability after jumping, or test an overlapping cast.
5. Keep the same computer IP/port/browser profile for saved progress. Browser saves are local to that origin; private browsing, cleared data or blocked storage may not persist. No cloud account is used. To stop serving, Ctrl+C. No service is installed.

A previously loaded page continues after its network is disconnected. Reload still needs access to the computer: there is **no service worker/offline installed PWA**. Direct single-file/Electron operation has no network dependency. No phone installation or unsigned native package is claimed.

If same-Wi-Fi serving is unsuitable, an HTTPS private preview could be proposed for **explicit separate owner deployment approval**, pinned to this commit with no `main` update. None has been deployed.

## Coordinated six-level checklist

Record tester/date/build SHA, OS/device/browser version, orientation and audio hardware. Mark each PASS/FAIL/NOT TESTED and include a screenshot/time/location on failure.

- Play, all five portraits, Start, Back, Continue, Level Select/unlocks, Controls and Settings. Restart confirmation, pause/settings/resume, game over and final victory. Existing hero/music/effects/mute/reduced-motion preferences should survive reload where storage is available.
- At native scale compare picker identity to moving heroes. Check actual cycling feet/arms, both directions, idle/jump/fall/landing/hurt/victory. Review six environment identities, castle foundation, lighting, platforms versus scenery, visible hazards, enemies, ability effects and pickup readability. Formal reference/art acceptance stays with the owner.
- Play all six expanded levels; note exploration time separately from retries. Assess three new platform/coin/encounter/crossing beats and retry terraces. Test every hero's power; they remain optional.
- Starry Night: collect **leaf boots** on the lower approach before the shortened raised spike row. High Jump grants **two separate equally strong grounded jumps**; hold to reach full height, do not expect a double-jump. Check **2 →1 →0**. Try early/late/short/held jumps with each hero. Waste both charges and verify death/restart gives a fair retry. The ordinary route remains possible without boots.
- Gold-rimmed shield blocks one hit and clears; pits still kill. Check coins, enemy armor cracks, one-time +50 defeats and no duplicate rewards after checkpoint death. Restart rolls back level points. Continue/Level Select do not bank score/lives/boss damage.
- Guardian: inspect weight, jointed stone/moss/weak seam, three phases, rocks, cracks/ground shockwaves and marked falling debris. Read warnings from animation/sound/ground cues. **No AI state, future move, recovery command/countdown or debug text** should appear. Defeat without powers and with each power; exit stays locked until defeated. Judge opening length and head-bounce effectiveness; automated victory is not human balance acceptance.
- Phones: move+jump+ability simultaneously, drag off buttons/cancel, pause/focus switching, safe areas/notches/browser bars, portrait↔landscape, no stuck contacts/overlap, long play/performance/heat and low-power conditions. Test audible music/effects/mute at0/mid/full and background/foreground behavior.
- Windows: offline start, physical keyboard and F11, resizing/Alt-Tab/minimize/restore, saved settings, portable restart and optional installer/uninstaller/shortcuts/DPI/security prompts.

See `docs/stage-h-verification.md` in the draft/source for technical results and the evidence artifact for normal-input video, native-size frame sequences and labeled fixture comparisons. Human/device/art/audio acceptance remains pending; no approval is inferred from downloading this bundle.
