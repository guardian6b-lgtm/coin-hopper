Issue28 — isolated Sunny Meadow illustrated playtest

Draft PR base: `codex/owner-playtest-followup` (draft PR29).
Head: `codex/sunny-meadow-art-prototype`.

Adds an opt-in original-art Sunny Meadow trial above the verified mobile/combat/music/Core repairs. Standard remains default; Illustrated and Illustrated Lite offer locally embedded orchard/castle/river scenery, bounded parallax, cached dimensional terrain and reduced-motion/failure fallbacks. The actual approved reference PNG and mascot atlas remain unchanged. Levels2–6 and the title backdrop are pixel-identical across quality modes. No wider rollout is approved.

The same candidate contains all repair-stage features: Android layout/upper-route framing, readable picker faces/touch instructions, charged E/touch abilities, fairer five-hit midpoint Guardian, distinct original level arrangements/evolving Summit music, and an optional finite-shot Star Core/pickup trial. Shared Core art/input remain provisional for owner decision. The adventure remains12planned levels;7–12/true final boss/Team Rally/Enhanced Edition are future plans only.

Validation/evidence:
-398regression cases, including all five heroes ×six levels without powers; explicit charged damage/targets/glide and storage/lifecycle/fallback tests.
- Real Chromium canonical campaigns, native touch/cancel/fourth-contact/resize/upper-route checks, charged/Core Canvas pixel checks, quality isolation, rendered signal/mix/loop tests.
- Ubuntu CI additionally runs WebKit; Windows CI builds NSIS/portable with `--publish never` and tests the actual installed/portable executables, all30hero-level routes, F11/resize/offline/persistence and the new mechanics/quality controls. Use current-head checks to establish final results.
- Native844×390/960×540 Standard/Illustrated/Lite screenshots, exact-owner-before comparisons, normal-input video,10original WAV previews, and per-engine/executable frame/input/asset profiles are temporary CI artifacts.

[Prototype report/native comparisons](docs/sunny-meadow-prototype.md) · [Design/balance decisions](docs/owner-followup-design.md) · [Verification/gaps](docs/owner-followup-verification.md) · [Single Windows/mobile test guide](docs/owner-followup-playtest.md).

![844×390 illustrated game](docs/screenshots/sunny-meadow/illustrated-844x390.png)
![960×540 illustrated game](docs/screenshots/sunny-meadow/illustrated-960x540.png)

The Windows artifact is the coordinated review package: exactHTML, both EXEs, private-LAN phone helper, screenshots/docs/listening samples, buildSHA and executable/source checksums. It expires after7days. Physical Android/iOS, human Windows, audible music, art and combat/Core balance acceptance remain NOT TESTED. Runner timings are not a phone60fps or input-to-photon certification. No merge, tag, release or deployment.
