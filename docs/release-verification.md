# Stage G — six-level technical verification and human acceptance record

Tracks [Issue #14](https://github.com/guardian6b-lgtm/coin-hopper/issues/14).
Branch `codex/release-verification` starts from verified Stage F at
`2a8caffe67fafa3c0fce356ac5a9d6c43896612e`. The
[verification draft](https://github.com/guardian6b-lgtm/coin-hopper/pulls?q=is%3Apr+head%3Acodex%2Frelease-verification)
records the exact final commit, hosted runs, artifact links and final CI outcomes.
The final acceptance record is also posted in Issue #14.

**This stage adds verification and documentation, with no game features.**
`index.html` is byte-identical to the verified Stage F Git blob
`3f9ce50a1503462e8cb0c528680391a4d1075705`. Product Electron configuration,
dependencies, copy script, permissions and the public release workflow remain
unchanged from verified PR #9. No merges, tags, releases, deployments or main pushes.

## Independently verified draft stack

| Stage | Draft / target | Verified feature head | Node / Chromium |
| --- | --- | --- | --- |
| A: shared HP, Shellback, Sentinel | [#17](https://github.com/guardian6b-lgtm/coin-hopper/pull/17) → abilities | `ddcdba9bfaee1a3d9f406883928237d140d1e6f0` | 196 / 54 |
| B: Crystal Caverns | [#18](https://github.com/guardian6b-lgtm/coin-hopper/pull/18) → enemy balance | `9375812bcf767162acbf6a0ccfb0c9f179eb430a` | 211 / 64 |
| C: Summit, Nightwing, Guardian | [#19](https://github.com/guardian6b-lgtm/coin-hopper/pull/19) → Crystal Caverns | `6381c6f81a169bfbc702591fc2ead0ef81eca765` | 241 / 79 |
| D: official-reference art | [#20](https://github.com/guardian6b-lgtm/coin-hopper/pull/20) → Skyline Summit | `b1f306b5e36ea75bad48239e552447767a7675a2` | 251 / 84 |
| E: original music/audio | [#21](https://github.com/guardian6b-lgtm/coin-hopper/pull/21) → visual redesign | `3f41ed80c16826b20770c332704951422e5abfc0` | 268 / 88 |
| F: saved progression | [#22](https://github.com/guardian6b-lgtm/coin-hopper/pull/22) → music/audio | `2a8caffe67fafa3c0fce356ac5a9d6c43896612e` | 308 / 94 |
| G: final verification | verification draft → progression | Exact final SHA in that PR | 308 Node; 95 browser cases, including a file-policy capability check |

All feature heads passed Node 22 on Linux/Windows, Chromium and actual NSIS/portable
build/smoke gates before their dependent stages began. Original foundation PRs
#1 → #3 → #8 → #9 remain unmerged. The reconciled README from #7 is preserved;
that separate roadmap PR remains unmerged. Stacked PRs must be reviewed in order;
any future merge/retarget/release needs separate authorization.

## Final verification scope

Local sessions span October 26–27, 2026 (America/New_York). Local Node is
24.19.0 on Debian 13 x64; CI uses Node 22. Local Chromium is 154; the packaged
Linux runtime reports Electron 44.7.2 / Chromium 152.0.7977.149 / Node 24.21.0.
Hosted Windows is a GitHub runner, not a physical consumer PC acceptance session.

| Check | Local / verified-parent result | Exact-head remote evidence |
| --- | --- | --- |
| Complete Node regression | PASS — **308**, zero failures/skips | Linux/Windows Node 22 outcomes in verification PR |
| Six definitions / movement / hitboxes / balance | PASS — original four definition hashes, six-level/authoritative-function lock; no game HTML changes in G | Same tests in both OS jobs |
| Chromium menus, keyboard, canvas, resizing, touch simulation | PASS — **94** checks, zero page errors, five viewports and all 30 legal routes | Full final suite plus file-URL capability result in PR/CI annotation |
| Direct browser `file://` | NOT TESTED locally — environment denied navigation; no override attempted | Independent hosted capability check reports PASS or NOT TESTED explicitly |
| Offline browser operation | PASS — exact self-contained HTML supplied to a real offline browser, native UI, storage and Web Audio | Browser JSON / screenshots / playable artifact |
| Linux actual packaged app | PASS — actual `app.asar` file loading offline, all **30** hero/level routes through normal New Game/Next/Finish | Local JSON retained; Windows independent jobs cover the same driver |
| Windows packaging / offline baseline | PASS on verified Stage F — NSIS + portable, actual apps, native F11/resize/minimize, saved settings/character/progress and audio signals | Final G build and both full 30-route executable outcomes in PR |
| Full 30 Windows campaign replays | NOT TESTED in this Linux workspace | Mandatory final Windows job performs each route in both actual executables; final PASS/FAIL recorded in PR |
| Enemy/power/shield behavior | PASS — shared one-time awards, two-HP armor, repeat-hit guard, terrain-safe projectiles, Nightwing timing, boss windows, all five powers, roots/glide, shields/pits/reset/pause | Node, browser and executable evidence |
| Original music / audio controls | PASS for signals — eight two-loop renders, independent buses, zero mute output, overlap peak ~0.491, retained pause position, safe autoplay/device fallback | Audio JSON and eight checksum-listed source WAV previews |
| Progression / anti-farming | PASS — validated saves, contiguous unlocks, locked guards, cancel, fresh Continue/selection, all five heroes, full process restart, no banked score/HP | Actual Windows flows and normal campaign transitions |
| Approved original PNG | PASS — signature/CRCs/decoding and exact owner-published hash | Original bytes archived in every dependent branch |
| Browser before/after captures | PASS — real C vs redesigned UI, five sizes, six scenes, menus and all 30 pose pixels | Browser artifacts; existing D Windows baseline/current captures remain linked in #20 |
| Human/device acceptance | NOT TESTED — checklist below | Must be recorded by a person; CI does not complete these items |

The final PR provides the global PASS / FAIL / NOT TESTED report for its exact
head, including remote Windows outcomes unavailable as local tests here. Temporary
CI artifacts contain builds, checksums, JSON and actual packaged captures. Current
environment downloads of signed hosted ZIP/log URLs have been blocked; job/step
success and artifact metadata can still be verified. Independent human inspection
of hosted Windows pixels/binaries remains open unless explicitly recorded later.

## Every character, every level, no powers

The Node and real-browser matrices are retained. The packaged-app driver now
starts each hero through **Play → character → Start game**, then uses only the
recorded left/right/jump inputs and native **Next / Finish** controls through all
six maps. It makes no direct level setup or actor/terrain edits during those runs.
RAF is suspended temporarily for exact fixed 60 Hz replay, then restored; these
are legal deterministic input recordings, not wall-clock human playthroughs.

| Hero | Meadow | Hills | Night | Gardens | Caverns | Summit + required boss | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hopper | 500 | 545 | 545 | 600 | 555 | 765 | **3510** |
| Minty | 500 | 545 | 545 | 600 | 555 | 765 | **3510** |
| Ember | 500 | 545 | 545 | 600 | 555 | 765 | **3510** |
| Nova | 500 | 545 | 545 | 600 | 555 | 765 | **3510** |
| Bolt | 500 | 545 | 545 | 600 | 555 | 765 | **3510** |

All finish with three lives, no special-power use or shield pickup. Summit takes
1768 frames with five distinct boss openings and no bypass of its locked exit.
Partial ability/armor hits award no score, defeats/flags award once, and Continue
or Level Select starts at zero instead of adding prior-attempt points. Checkpoints
remain optional/deferred as documented in [Stage F](progression.md).

Controlled fixtures are labeled separately: power interactions, late-game menu
availability, enemy/shot scenarios and locked-exit positioning. They do not replace
the separate legal route evidence.

## Official art and preview

The unchanged [original approved PNG](art/reference/coin_hopper_character_selection.png)
is 1672×941 / 1,954,012 bytes. SHA-256:
`6d4e5d7ebbab523c159983df725c1c9efd4c67a7988a284ec358608bee3d9f4d`.
Its isolated reference branch was not merged. Runtime characters are separately
identified generated assets derived from the actual inspected reference; scene/UI
art is an interactive Canvas2D/DOM interpretation. Formal owner art acceptance is open.

See [art provenance and comparisons](visual-redesign.md),
[music/source WAVs and routing](music-audio.md), [progression rules](progression.md),
and [preview instructions](preview.md). The final browser artifact includes the
standalone HTML, screenshots, JSON reports and eight WAV loops. Windows artifacts
contain NSIS/portable executables, SHA256SUMS and independent smoke reports, retained
seven days using `--publish never`. These are test artifacts, not public releases.

## Human acceptance — all NOT TESTED

Use a record with **device/model, OS, browser/app build, exact commit, tester,
date and PASS / FAIL / NOT TESTED**. No physical tester/device is supplied for
the following items, and none is marked complete:

- **Windows NSIS and portable independently:** interactive install/uninstall,
  shortcuts/Start Menu, physical F11, drag resize, Alt-Tab/focus, app reopen, offline
  play, consumer Windows versions/DPI and installer/signature prompts. Automation
  has tested native APIs/injected keys, not a person's physical keyboard.
- **Physical Android/iOS/tablet:** portrait/landscape, browser safe areas/chrome,
  simultaneous movement/jump/Ability, rotation during play, long sessions, heat,
  frame rate and stuck-touch recovery.
- **Speakers/headphones:** listen to all eight themes and five power/enemy effects
  at mute, middle and full volumes; judge loop feel, melody, mix and comfort during
  overlap. Verify real device/Bluetooth/hardware mute/background output behavior.
- **Art/readability/accessibility:** compare the actual chooser/game to the official
  PNG, recognize every hero at gameplay scale, review all six scenes/hazards,
  keyboard-only menus, screen reader labels, contrast, large touch targets and
  reduced motion. Review the actual Windows captures/binaries linked in artifacts.
- **Difficulty and boss balance:** all five heroes with and without powers,
  Shellback/Sentinel/Nightwing encounters, no-power Guardian, useful powers/fair
  cooldowns, readable warnings and dodge windows. Assess whether repeated boss
  head bounces are too easy and whether optional checkpoints would improve comfort.

Record confirmed defects against their stage PR and retest fixes. Subjective
balance, audible quality and human accessibility are not established by simulation.
Product version/changelog/release notes, licensing/attributions and distribution
decisions remain post-acceptance work. Nothing in Issue #14 authorizes a merge,
tag, deployment or release.
