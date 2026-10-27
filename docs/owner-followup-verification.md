# Issue28 verification — technical evidence, not owner acceptance

Owner baseline: PR27 `8f349cf921f968edf1f22c3f213ae8b108155f40`, HTML SHA256 `8f3c96f48576b0924362dff6dafd43eaec27b740bd2a205df59e04ae54db71da`.
Fix commits remain on `codex/owner-playtest-followup`, stacked against `codex/stage-h-integrated`. The isolated art branch stacks above these repairs. The exact downloadable candidate SHA/run and executable/HTML checksums are emitted in artifact `build.json` / `SHA256SUMS.txt`; inspect the PR checks for its current head. Historical Stage H reports remain unchanged.

## Local checkpoint results

| Check | Result | Evidence / limit |
|---|---|---|
| Owner baseline before edits | PASS |337Node tests |
| P0 independent commit50fea40 | PASS |339Node tests |
| Combat independent commitdb3eb81 | PASS |367Node tests, detached checkout |
| Combined repair/music/Core suite | PASS |380Node tests at first candidate;43targeted cases pass after Core placement/focus repairs (383total cases including upper-route camera coverage); existing regression cases retained and intentional timing/UI expectations revised |
| Six levels ×five heroes | PASS |30Chromium routes, no powers/shields; identical3755campaign total,3lives; new Guardian five-opening route |
| Chromium retained browser suite | PASS |94PASS groups, one separately labeled file-mode NOT TESTED |
| Chromium mobile/layout/animation +new charge/Core checks | PASS |15Stage H groups (including six legal native-landscape routes) +12follow-up groups; native844×390/portrait/short-height controls, all five charge tiers/independent Core/pause |
| Real Web Audio | PASS |10distinct loop signals/seams, two loops each, independent buses/mute/master headroom; Summit event/phase cases also inNode |
| Blocked/corrupt storage | PASS |Original keys safe, prototype defaults OFF; persistence tests |
| Native screenshots | PASS |Exact-owner-before/after844×390,960×540,390×844 picker/world/Brick Hills/Guardian; Core/combat screenshots are labeled fixtures |
| Local standalone Chromium file navigation | NOT TESTED |Environment denied file URL; HTTP+disconnected execution passed. Actual packaged Electron is a separate check |
| Local WebKit | NOT TESTED |Browser runtime unavailable and download returned403; Ubuntu CI installs and runs WebKit separately |
| Windows NSIS/portable &actual EXE smoke | NOT TESTED locally |Executed by Windows verification CI, not inferred from Linux; current-head run/results/artifacts are attached to PR |
| Physical Android/iOS, audible quality, human Windows | NOT TESTED |No physical hardware/listening/operator session performed |
| Owner art/combat/music/Core acceptance | NOT TESTED |Explicit owner decision pending; no automated test substitutes |

Measured Chromium360six-scene draws on this desktop runner: mean5.08ms,p95 3.90ms,max118.90ms (includes cold initialization; raw artifact retains distribution summary). This is CPU draw-call timing, not physical-phone frame pacing/GPU/battery or a60fps certification. Prototype has a separate warmed frame/input/size profile.

## Reproduce

Node22+: `node --test`. Browser tools are isolated (Playwright1.62.0 in CI): `node scripts/verify-browser.cjs`, `STAGE_H_WEBKIT=1 node scripts/verify-stage-h.cjs`, `node scripts/capture-owner-followup.cjs`. Set `COIN_HOPPER_TEST_OUTPUT` for evidence location. `node scripts/export-music.cjs OUTPUT` produces all10WAVs with hashes from the actual shipped composer. Named combat/Core fixture setups are not full level playthroughs; canonical route checks replay only controls.

CI retains NodeLinux/Windows, full Chromium and WebKit checks, copied/canonical/ASAR HTML byte gates, Windows NSIS and portable `--publish never`, actual installed/portable launch, offline operation, saved preferences, F11/resize, all30campaign routes, charged/Core checks and screenshot artifacts. Ubuntu browser job is pinned24.04 with25minutes to install supported engines. Windows artifact contains both EXEs, exactHTML, phone-serving helper, owner guide, reports, screenshots, WAVs and checksums, expiring7days. No public release or deployment.

## Remaining human checks and decisions

Use [coordinated playtest guide](owner-followup-playtest.md). Physical touch ergonomics (including four contacts, notches/browser bars), iOS/Android real audio suspension, long-session heat/battery/fps, audible mix/theme judgment, actual Windows install/uninstall/DPI/security, accessibility/face readability, Guardian fairness with Minty/Nova, Core pickup density/control scheme and isolated Sunny Meadow artwork remain owner acceptance. A desktop-emulated touch pass is not a physical-device pass.

Open balance proposals are documented in [design note](owner-followup-design.md): quantized5HP bands, bounded charge strengths, onebossHP/opening, shield→Core precedence, optional shared six-shot Core and opt-in extra pickup locations. Existing scoring formula/level geometry/base physics remain guarded; longer boss time changes its time bonus. No Levels7–12, Team Rally or Enhanced Edition code is included.

Follow-up pickup audit corrected two trial Core positions above their raised platforms and added standing/jump collection tests; native keyboard Core returns canvas focus. The executable test helper restores its prior hero after isolated fixtures, preserving later persistence checks.

The coordinated Windows artifact now emits a runtime PASS/FAIL/NOT TESTED matrix and exact source/executable checksums from actual CI reports, and refuses sealing if either executable smoke test fails. New landscape route instrumentation checks thousands of legal-route frames, including upper platforms; it observes rendering only.

Final charged-art correction: Ember fireball artwork scales with its real projectile radius; a native Canvas pixel-bounds check confirms a full charge is visibly larger than a tap. Tap artwork and damage timing remain intact.
