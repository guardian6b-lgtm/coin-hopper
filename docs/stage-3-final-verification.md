# Stage 3 final technical verification

Date: 2026-10-26. PR: [#3](https://github.com/guardian6b-lgtm/coin-hopper/pull/3).
Branch: `codex/moonlit-gardens`; base: `codex/gameplay-menus`.

**Recommendation: technically ready for human acceptance testing.** No confirmed
gameplay or packaging defect was found. This is an automated technical gate, not
human acceptance or permission to merge, deploy, tag, or publish a release.

The Windows executables were built and tested from PR head
`a4bd543c35d55b83a334abe9ddff30e649890fd7`. The follow-up commit containing this
report changes documentation only. The complete game page and desktop application
files are byte-for-byte unchanged from starting PR head
`ab86f33cca79bb283eb18250a961eab811c99821`.

## Windows artifacts and execution

- [Windows verification run 40410548713](https://github.com/guardian6b-lgtm/coin-hopper/actions/runs/40410548713)
  completed successfully on `windows-latest`, with Node 22.
- [Download the Windows x64 verification artifact](https://github.com/guardian6b-lgtm/coin-hopper/actions/runs/40410548713/artifacts/12692227945).
  It contains the NSIS installer, portable executable, `SHA256SUMS.txt`, `build.json`
  recording the tested commit, gameplay TAP output, per-executable JSON reports,
  diagnostic logs, and fullscreen/Moonlit Gardens screenshots. Retention: seven days.
- Builds use the existing `desktop/package.json` targets and lockfile, with
  `electron-builder --win nsis portable --x64 --publish never`. The release workflow
  is unchanged and was not invoked. The new verification workflow has read-only
  repository contents permission and uploads only temporary Actions artifacts.
- The NSIS installer was run silently into the runner's temporary directory, and
  the installed **Coin Hopper.exe** was launched. The actual portable executable
  was launched independently; it was not replaced with an unpacked-app shortcut.
- The app is unmodified. The smoke runner connects to temporary main-process and
  renderer debugging endpoints, uses isolated save profiles, and tests real
  executable processes. The endpoints are launch arguments for these CI tests,
  not additions to the product's default startup or packaged source.

The successful workflow includes the build, checksum retention, installed-app
smoke, portable-app smoke, and artifact upload steps. GitHub metadata confirms
the uploaded artifact belongs to the tested SHA and is unexpired. The cloud
environment's proxy blocks hosted log/artifact download destinations, so those
remote bytes were not downloaded into this machine; the evidence files remain
available in the artifact for review.

## PASS / FAIL / NOT TESTED

| Check | Result | Evidence and exact scope |
| --- | --- | --- |
| Windows x64 NSIS build | PASS | Existing Electron configuration; explicit x64 and `--publish never`; installer retained as temporary artifact. |
| Windows x64 portable build | PASS | Existing portable target; actual executable retained in the same artifact. |
| NSIS installation and installed executable launch | PASS | Silent installer exits successfully, installed executable exists, and its packaged `app.asar` game opens. Interactive wizard choices were not exercised. |
| Portable executable launch | PASS | Actual portable launcher starts its packaged game and passes the independent smoke process. |
| Windows offline functionality | PASS | For both executables, the renderer is put in browser-context offline mode, its local page is reloaded, and gameplay/menu controls continue to work. This does not claim a physically disconnected machine. |
| Windows settings persistence | PASS | For each executable, effects 25% and music preference 80% survive closing and restarting the executable with the same isolated profile. No music playback is implemented or claimed. |
| Windows F11 fullscreen | PASS | For both executables, native Electron key input reaches the shipped F11 handler, enters fullscreen, matches display bounds, and exits fullscreen. This is automation on the Windows runner, not a person pressing a physical keyboard. |
| Windows resizing | PASS | Native window changes to 1120x720; renderer size changes; canvas remains within the viewport at its original aspect ratio. |
| Windows game controls and menus | PASS | Keyboard move/jump, native Play/Settings/Back/Pause/Resume, frozen paused state, and Moonlit Gardens shield pickup run in both actual executables. New-level setup is a runtime smoke fixture, not a human four-level playthrough. |
| Full automated gameplay suite | PASS | `node --test`: 64 passed, 0 failed/skipped/cancelled/todo locally on Node 24.19.0; Node 22 Windows verification also reruns the full suite. Hosted Linux/Windows Gameplay checks pass at the tested head. |
| All four level routes | PASS | All four recorded input routes and the continuous four-level run reach completion without damage or shield collection. This includes Sunny Meadow, Brick Hills, Starry Night, and Moonlit Gardens. |
| Browser/mobile simulation | PASS | `node scripts/verify-browser.cjs`: all eight checks pass again on Chromium 154 / Playwright 1.62. Routes run with a controlled 60 Hz scheduler; live keyboard, shield/damage/pit/restart, resize and CDP multi-touch checks use the real page. No page JavaScript errors. |
| Moonlit Gardens platform reachability | PASS | All ten separate raised/stepping platform groups reached by search-discovered routes, then independently replayed through real keyboard handlers on an unmodified map/player. All replays retain three lives. Shield collection is allowed in these platform checks; the separate full-level route collects none. |
| Moonlit Gardens coins/hazards | PASS | All 24 coins have supporting ground/platform tiles. Reviewed five pits and nine spike tiles, four hoppers, two walkers and two shield pickups. Spawn/finish support and the unprotected completion route pass. |
| Shield and hopper behavior | PASS | Tests cover single-hit enemy/spike absorption, non-stacking, recovery, pit bypass, death/restart/transition resets, fixed hop timing, patrol turns, stomp points/bounce/cleanup, and pause freezing. |
| Original levels and movement physics | PASS | Original map hashes/order pass. Movement formulas compare exactly with validated menu baseline `2edca54`; the whole game page remains identical to this verification task's starting head. |
| Original scoring and menus | PASS | Existing coin +10, stomp +50, completion bonus, lives and best-score cases pass. Menu/pause/settings/controls/restart/completion regressions pass; this verification does not change application source or menus. |
| Confirmed product defects | PASS | None found; no gameplay, map, physics, scoring, menu or desktop-code fix was necessary. Only verification tooling and documentation were added. |
| Human difficulty/progression assessment | NOT TESTED | A person must judge challenge beyond Starry Night, fairness/readability of hop timing and hazards, optional platform rewards, and shield placement. Reachability does not establish perceived balance. |
| Human Windows installation and desktop UX | NOT TESTED | Interactive NSIS wizard/shortcuts, visible fullscreen transitions with a real keyboard, alt-tab/focus, dragging window edges, and multi-monitor behavior need a human acceptance session. |
| Physical touch/mobile devices | NOT TESTED | Real phone/tablet gestures, orientation/browser chrome, touch comfort, and device rendering require hardware. CDP touch simulation is reported separately. |
| Audible sound and audio hardware | NOT TESTED | No listening session, speakers/headphones, or device audio output was used. Saved volume preferences and existing automated gain tests do not establish audible quality. |

No failed product checks remain. NOT TESTED items are acceptance/hardware gates;
they are not converted to PASS because automated checks succeeded.

## Level review details

Moonlit Gardens introduces its first shield on a safe stretch before the first
hopper, then combines longer traversal, spike groups, pits, and predictable enemy
timing. Hoppers launch after 0.7 seconds and subsequently on a 0.95-second cycle
when grounded; they retain the original 50-point stomp reward. Pause freezes their
timer. Shield recovery gives one second to leave contact; pits still cost a life.
The 847-tick recorded route demonstrates the shield is optional for completion.

Platform replay reached every raised group (tile columns are half-open ranges):

| Top row | Column ranges | Replay result |
| --- | --- | --- |
| 9 | 53–58 | PASS |
| 10 | 39–46, 75–82 | PASS |
| 11 | 19–24, 31–35, 51–55, 65–71, 87–92 | PASS |
| 12 | 37–38, 75–76 | PASS |

The platform search explores only directional/jump input and restores simulation
snapshots to explore alternatives. Each reported result was then replayed from a
fresh fourth-level start through the shipped input handlers, without world/player
edits, enemy removal, collision bypasses, life changes, or forced protection.
These are individual platform routes, not a claim that one route collects every
coin. No layout change was needed.

Local browser screenshots, platform replay inputs/results, and the refreshed TAP
file are retained under `/workspace/.cloud-setup/coin-hopper/stage3-final/` in the
verification environment. Windows evidence is in the temporary CI artifact above.

## Next action

Keep PR #3 as a draft while a human downloads the two Windows executables and runs
the acceptance/hardware checks marked NOT TESTED. Record platform/device and
results in the PR. If those pass, the maintainers can decide whether to approve
the PR. No merge, tag, release or deployment is part of this verification task.
