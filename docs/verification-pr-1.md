# PR #1 technical verification

Date: 2026-10-26. Branch: `codex/gameplay-menus`.

Application commit tested: `34afcc9c7dc41e13bf485955f454bec30554e92e`.
Comparison baseline (`main`): `362984cc9402cfe10b5dadf239f2726cd324030c`.
The follow-up commit containing this report changes documentation only; the tested
application, automated tests, maps, physics, and packaging configuration are unchanged.

Recommendation: **ready for review**. No confirmed blocking defects or regressions
were found. This is not Windows release approval: the manual checks below remain open.
No application fixes were made, and no release was published or PR merged.

## Results

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Full automated suite | PASS | `node --test`: 43 passed, 0 failed, 0 skipped/cancelled/todo, on Node 24.19.0 (meets Node 22+ requirement). |
| Original levels | PASS | Compared the complete `LEVELS` data directly with `main`: names, skies, maps, and order are identical. The existing map hashes and damage-free recorded routes pass for Sunny Meadow, Brick Hills, and Starry Night. |
| Gameplay foundation | PASS | Existing tests exercise acceleration/speed limits, variable jump height, buffered jumps, coyote time, collision, coin scoring once (+10), enemy stomp scoring once (+50), bounce, enemy cleanup, damage/respawn, invulnerability, falling, lives, completion awards, and best-score storage. These are VM simulation tests, not a human playthrough. |
| Play / Settings / Controls | PASS | Real Chromium clicks, Tab/Shift+Tab focus wrap, Enter/Space activation, Escape return, native slider arrow keys, and starting a fresh run. |
| Pause / Resume | PASS | P, Escape, on-screen Pause, Resume, and simulated window blur work. Player/enemy state, lives, coins, score, and timer stay frozen through paused Settings/Controls and return to Pause. |
| Restart | PASS | Real browser Cancel and Escape preserve a staged run exactly; confirmation resets the current level's points, coins, and objects while retaining earlier points and remaining lives. |
| Game Over / Level Complete / Win | PASS | Real browser menus for all three completions, collected/total coin displays, one-time awards, Next level, Finish, Win, Game Over, and Try again. End conditions were staged through runtime evaluation; damage-free full-level routes are covered separately by the Node tests. |
| Keyboard controls | PASS | Real browser input for arrows, A/D, Space, W, Up, P, and Escape; native menu keyboard navigation also exercised. |
| Canvas and visual inspection | PASS | Real Canvas2D rendering and screenshots inspected for desktop gameplay/pause and simulated mobile landscape/portrait. Character, tiles, coins, enemies, HUD, touch controls, and native menus render. This is headless Chromium inspection, not a human play session. |
| Window resizing | PASS | Canvas fit/aspect ratio and reachable menu actions checked at 1920x1080, 800x600, 390x844, 844x390, and 320x240. Short menus scroll to Back. |
| Simulated mobile touch | PASS | Chromium touch emulation/CDP: menu taps, simultaneous move+jump, release, touch cancellation, canvas Pause, Settings/Back/Resume, cleared held inputs, and landscape-to-portrait resize. No physical phone was used. |
| Persisted audio settings | PASS | Effects and music preferences survive a real browser reload; changing the effects slider updates its live gain. The packaged Electron app also retains effects volume across process restart. Music is explicitly a saved preference only; no music track is implemented. |
| Effects-volume signal behavior | PASS | A real Web Audio analyser sampled jump, coin, stomp, hurt, completion, and game-over effects: all six produced RMS 0 at 0% and nonzero signals at 25%/100%, with stronger signals at 100%. No speaker listening is claimed. |
| Windows packaging configuration | PASS | `desktop/package.json`, lockfile, main process, copy script, icon, and Windows release workflow are unchanged from `main`. Copied page matches root `index.html`; Linux packaging uses the same configured app files and includes the menu page in `app.asar`. |
| Local Electron build / launch | PASS | Built the unpacked Linux x64 app with Electron 44.7.2 / electron-builder 26.15.3 and `--publish never`. Launched the packaged `file://.../app.asar/index.html`, exercised offline Play/movement/Pause/Controls/Resume, persisted settings across relaunch, and observed no page JavaScript errors. |
| F11 handler | PASS | Native Electron `webContents.sendInputEvent` reaches the existing handler and requests fullscreen. Actual visible fullscreen transition is not verified on the headless display. |
| Confirmed application failures | PASS | None found in the checks performed; no assertions were disabled and no application source or test changes were needed. |
| Audible playback / sound quality | NOT TESTED | No speakers or listening session. Signal/gain measurements above do not establish perceived playback quality. |
| Physical mobile devices / other browsers | NOT TESTED | Real iOS/Android gestures, orientation, browser chrome, ergonomics, Safari, Firefox, and Edge remain manual checks. |
| Windows installers and execution | NOT TESTED | Linux host; no Windows runtime or Wine. NSIS/portable builds, installation, Windows offline playback, and visible F11 behavior require Windows verification. |
| Hosted CI and PR review status | NOT TESTED | `api.github.com` is denied by the environment proxy (HTTP 403 on CONNECT), so hosted checks/reviews and API comments could not be inspected or posted. Local Git refs confirm PR #1 and the named feature branch identify the tested application commit. This report is delivered through the feature branch's PR diff. |

## Review observations

The diff keeps the original maps and movement formulas intact. The targeted
damage fixes stop simulation after a respawn/game-over transition, and the enemy
cleanup fixes prevent expired stomped enemies from remaining or reviving. Their
regression tests pass. Menu actions use native DOM controls, clear held inputs,
preserve pause state, and guard stale clicks. Settings handle blocked storage and
invalid saved values. No additional correctness or maintainability issue warranted
a change in this verification pass.

The dependency-free VM suite stubs drawing, audio, and DOM behavior; a green run
alone cannot validate browser input/rendering. Real browser checks supplemented it
here. They are not currently part of the repository's CI workflow. The compact
single-page architecture remains consistent with the existing game; this review
does not introduce a refactor before expansion.

## Commands and environment

Linux x64; Node 24.19.0, npm 11.9.0, Python 3.12.14, Playwright 1.62.0,
system Chromium 154.0.8037.57, Electron 44.7.2, electron-builder 26.15.3.

```sh
# Repository root
node --test
git diff --check
python3 -m http.server 8000 --bind 127.0.0.1 --directory /workspace/coin-hopper

# Separate shell, desktop directory
npm run copy-index
cmp ../index.html index.html
XDG_CACHE_HOME=/workspace/.cache \
ELECTRON_CACHE=/workspace/.cache/electron \
ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder \
NODE_USE_ENV_PROXY=1 \
node_modules/.bin/electron-builder --linux --dir --publish never \
  --config.electronDist=node_modules/electron/dist
```

Ad hoc Playwright checks, JSON results, Node TAP output, and screenshots are retained
in `/workspace/.cloud-setup/coin-hopper/pr1/` in the verification environment; that
directory is outside the checkout and is not a public artifact or CI upload.
Browser checks used the actual page without modifying its source. Isolated runtime
fixtures were used for restart and end-state scenarios, and the real Web Audio
graph was inspected for sound measurements.

The headless Electron display initially reported a 1x1 viewport; explicitly setting
the automation viewport to 960x540 restored pointer hit testing. CDP keyboard
injection does not exercise Electron's main-process F11 handler, so the handler
check used native `sendInputEvent`. These were automation limitations, not game
fixes. Electron was launched with `--no-sandbox --ozone-platform=headless` in the
isolated Linux container. None of these flags change the Windows configuration.
The builder's missing repository-metadata notice was nonfatal and publishing was
disabled. TLS and artifact checksum verification stayed enabled.

## Remaining manual gate

- On Windows, run the existing CI build or build NSIS/portable locally without
  publishing, then install/launch, exercise menus/controls, verify offline behavior,
  restart persistence, window resizing, and F11 entering and leaving fullscreen.
- Listen to jump, coin, stomp, damage, completion, and game-over sounds after a user
  gesture, including mute and intermediate effects volume.
- Play the original three levels normally and assess movement feel and visual/audio
  timing. Automated recorded routes establish reachability, not a human playtest.
- Use real phones/tablets to test simultaneous controls, canceled gestures, scrolling
  long pause menus, portrait/landscape changes, and touch target comfort.
- Inspect hosted Linux/Windows gameplay checks and PR reviews once GitHub API access
  is available. No hosted CI result is inferred from the local run.
