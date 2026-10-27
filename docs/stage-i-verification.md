# Stage I verification — art approval checkpoint

Verified parent: `codex/sunny-meadow-art-prototype`, **5e82e70a2f1357e225620334f657c806d3edf793**. Review branch: `codex/stage-i-prototypes`. PR27/PR29 and the complete reconciled twelve-level roadmap remain intact. The earlier398-test parent suite was independently rerun before development. The gait correction is commit `5e181b2d27e3bc5ac9dd122474b3b4d26090c20e`.

This checkpoint follows the latest owner correction: **refine the established heroes, do not reinvent them**. No proposed Hopper/Walker or rejected Crownstride/Crownkeep/Crestspring artwork is integrated. The [painted Hopper comparison and motion study](art/stage-i/concept-review/index.html) is pending concept approval. A single painted portrait, not a full atlas, was created. The other four heroes retain their current artwork. C3 Guardian direction is independently approved for a gameplay preview.

## Results

| Check | Result | Evidence / limits |
|---|---|---|
| Full Node regression, Node24 locally (CI Node22) | **PASS — 423/423** | Original398 +12 gait cases +13 StageI cases. No failures/skips. |
| Six maps / enemy parameters / Guardian timing / five ability definitions | **PASS** | Serialized definition hashes equal the verified parent; source original reference/scenery untouched. |
| All six levels × all five heroes without powers | **PASS** | Existing campaign routes plus five additional preview-enabled complete campaigns; original lives/score and all five separate boss-hit frames retained. Simulation replays, not human playthroughs. |
| Existing Chromium regression | **PASS — 94 groups** | Selection, real keyboard, simulated touch, powers/enemies,30 hero/pose renders, six-level routes, settings/progression and real OfflineAudioContext music/effects. One separate browser file-URL item is NOT TESTED because this environment denied access. |
| StageH / charged abilities / Core / Meadow prototype Chromium | **PASS — 32 groups** | Native tap/hold/release tiers, multitouch fixtures, cooldown/pause, shield/Core, guardian2.8s/oneHP contract and original Standard/Illustrated/Lite isolation/profile. |
| New C3/Hopper-review Chromium | **PASS — 9 groups** | Native idle/windup/throw/open/damage/walk/death/rubble fixtures at844×390,390×844,960×540; effects gain rendering; preview setting; five picker sizes; isolated comparison/video capture. |
| Picker title/footer, all5 choices and Jump inset | **PASS** | Simulated touch at844×390,390×844,960×540,568×320,320×240. This is desktop emulation. |
| Foot contact all5heroes, both travel directions | **PASS** | Planted-foot world position, lifted recovery, distance timing, inertial turns/pause and rooted enemy distance assertions. Actual ordinary-spawn input clips supplied. Art/animation quality still requires owner review. |
| C3 combat contract and lettering orientation | **PASS** | 5HP,68×64,2.8s,oneHP/opening; renderer does not mutate simulation. C3 armor is never mirrored. Per-pose source bounds replace incorrect uniform slicing of the irregular sheet. |
| Defeat / persistent non-colliding rubble | **PASS** | Fixed-step2.1s settling, pause freeze, one-time score, checkpoint-death persistence, restart/transition reset, static reduced-motion pile. No collision actors/grid edits. |
| Original stone Foley | **PASS — signal/routing only** | Deterministic bounded samples, click-ended buffers, effects bus, pause/mute guards and real25% OfflineAudioContext output. WAV/OGG listening samples included. Audible approval NOT TESTED. |
| New Guardian render cost | **PASS — measured runner profile** |240 headless draws; profile JSON supplied with its p95/mean. Guardian decodedRGBA6,290,064bytes. HTML6,003,254bytes, below canonical8MiB packaging buffer. Not physical-phone FPS/thermal/battery. |
| Packaged Windows NSIS/portable and exact-build smoke | **NOT TESTED locally** | Windows CI extended for this branch, including the actual offline C3 renderer. Record the successful exact-commit run/artifacts before treating it as a pass. Historical parent Windows results are not StageI results. |
| WebKit / iOS-browser approximation | **NOT TESTED in initial local report** | Local WebKit runtime download failed with403 Domain forbidden; added to isolated CI Chromium/WebKit job. A successful WebKit run does not imply physical Safari acceptance. See supplemental results when available. |
| Physical Android/iOS, human Windows/DPI/input/audio | **NOT TESTED** | Requires actual devices and human interaction. |
| Hopper replacement atlas / new hero artwork in game | **NOT TESTED / deliberately not implemented** | Explicit owner concept-approval gate. Motion examples are a single-image blockout outside runtime. |
| Full new Meadow/Guardian music arrangements | **NOT TESTED / deferred checkpoint** | Existing ten themes preserved. Foley samples are not music A/B prototypes or listening approval. |

The new C3 pixel fixtures and local source comparison use HTML SHA256 **97cea421e8815eae4c33332d180c50e939665087d49db58fbcfa2cf1c6fe709d**. Source commits are identified by Git/CI; working-tree screenshots are identified by this exact page hash rather than falsely attributed to their earlier HEAD. CI reports and packaged-page checks compare committed canonical/source/copied/packaged bytes. Final commit and remote run links belong in the draft PR and delivery report.

## Art provenance and review limitations

The approved selection PNG (`6d4e5d7ebbab523c159983df725c1c9efd4c67a7988a284ec358608bee3d9f4d`), existing hero atlas and Sunny Meadow plate remain unchanged. `art/stage-i/manifest.json` records new output hashes, sizes, source rectangles and approval state. C3 derives from the owner’s inline image through image generation, with inscriptions reduced to selected plates/fragments; original attachment bytes were not exposed, so this is not claimed to be a byte-copy. The retained PNG was encoded at the same dimensions as WebP using FFmpeg. No remote runtime assets were introduced.

Native gameplay screenshots are unretouched browser captures. The proposed Hopper gameplay comparison is explicitly a **render-only overlay mockup**, never a shipped sprite. The Guardian clip uses a named low-HP combat fixture and an injected legal final hit to demonstrate collapse; ordinary no-power routes are tested independently. Static pose transitions and articulated feet are a review preview, not accepted final animation craftsmanship. C3 detail at the retained gameplay dimensions, foot weight and vulnerability readability require owner review. Generated source detail does not establish a guaranteed legal/originality judgment.

Confirmed defects fixed: forward-sliding stance/inertial facing; picker header/footer focus-scroll clipping; right-edge Jump placement; uniform-cell Guardian sampling that picked up neighboring poses. Boss death now retains non-colliding visual remains without duplicate rewards. The oversized external vulnerability ring is replaced by anatomical core light. Existing hitboxes, AI timing, movement, maps, score and progress are preserved.

## Reproduce and outstanding delivery

```sh
node --test
node scripts/verify-browser.cjs
node scripts/verify-stage-h.cjs
STAGE_I_WEBKIT=1 node scripts/verify-stage-i.cjs
STAGE_I_GAIT=1 node scripts/capture-stage-i.cjs
node scripts/export-stage-i-audio.cjs /tmp/coin-hopper-foley
node scripts/serve-stage-i.cjs
```

Browser scripts require isolated Playwright; FFmpeg exports OGG. The Windows workflow uses existing Electron NSIS/portable configuration and `--publish never`, tests actual installed/portable EXEs and retains temporary7-day artifacts. Nothing is merged, tagged, released or deployed. Local API access currently returns403 from `api.github.com`, so draft PR creation is a delivery blocker if it persists; Git push/public CI pages remain separate capabilities. The review body/compare URL can be supplied without misreporting a created PR.

Recommended next action: review the concrete [Hopper comparison](art/stage-i/concept-review/index.html) and [C3 evidence](art/stage-i/index.html), collect exact-build Windows/WebKit CI results, then obtain the required Hopper concept decision. Do not generate/integrate the replacement atlas or roll this art direction across heroes/worlds before approval. Physical-device, audible, art and balance acceptance remain separate.
