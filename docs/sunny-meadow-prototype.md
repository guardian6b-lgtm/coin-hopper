# Issue28: isolated Sunny Meadow illustration prototype

This experiment is stacked on the owner-playtest repair branch, not rolled out to the other five levels. Standard remains default. The repair branch and PR27 remain available as separate rollback candidates. [Issue28](https://github.com/guardian6b-lgtm/coin-hopper/issues/28) authorizes this one-level trial; only the owner can approve wider adoption.

## Implemented scope

Settings → **Sunny Meadow art quality** offers Standard, Illustrated and Illustrated Lite. The versioned `coinhopper_meadow_art_v1` preference is separate from character, settings, progression and Core trial storage. Invalid/blocked storage defaults Standard. The bundled PNG decodes only after opt-in; load/decode failure falls back to Standard. No remote image request or rendering engine dependency is added.

An original rounded orchard valley adds layered distant hills, connected castle architecture, a river/bridge/waterfalls, fruit trees and soft daylight. The original image-generation output is retained byte-for-byte in [art/prototypes](art/prototypes/sunny-meadow-original.png), with dimensions/hash/provenance in its [manifest](art/prototypes/sunny-meadow-provenance.json). It was generated using the actual approved Coin Hopper reference as style guidance; no named-game artwork, sprites, textures or recordings were copied. The approved reference and mascot atlas remain unchanged. This new image is a proposal, not an owner-approved replacement reference.

Canvas2D draws a bounded, slowly moving distant plate, a separate middle-distance cloud/light layer and a shallow foreground confined below the walking area. Illustrated terrain uses cached shaded earth/turf tiles with crisp tops at the existing collision edges; spikes, pickups, enemies, hero rigs and effects retain their own readable silhouettes. Lite removes decorative lighting/cloud/foreground passes and simplifies cached tile detail. Reduced motion stops decorative parallax. Base physics, level geometry, hitboxes, scoring and progression remain untouched.

Levels2–6 render **pixel-identically** when the quality preference is switched on. Menu/picker backgrounds retain the existing renderer; their P0 face/instruction fixes belong to the repair PR. High phone routes use the repair branch's display-only vertical framing rather than disappearing above a fixed crop.

## Verification and limits

| Check | Result | Scope |
|---|---|---|
| Full gameplay suite | PASS |398 tests including383 repair regressions +10 prototype cases +5 functional charge-outcome cases |
| Art/simulation isolation | PASS |All five heroes ×six scenes ×three modes preserve full simulation snapshots |
| Levels2–6 pixels | PASS |Real Chromium mode comparisons, no hidden rollout |
| Optional asset/fallback/storage/cache | PASS |Original/embedded byte match, invalid/blocked preference, missing/error image fallback, bounded4tile cache |
| Actual viewport comparison | PASS |844×390 and960×540 Standard/Illustrated/Lite screenshots, same scene state |
| Legal no-power routes | PASS |Retained six maps, all five heroes in full suite; mobile camera adds six legal routes/11,255 checked frames |
| Browser performance | PASS measurement |Runner CPU/frame and event-to-simulation profiles; see artifact JSON |
| Physical Android/iOS fps, battery/heat, input-to-photon | NOT TESTED |Desktop emulation cannot establish these |
| Human art/readability/visual hierarchy acceptance | NOT TESTED |Owner compares playable trial before any adoption |
| Final-head WebKit and Windows packages | CI verification required |Exact run/status/checksums and per-executable reports in temporary artifacts; never inferred from Chromium |

Local isolated first profile (180 scheduled simulation/render frames per mode, desktop Chromium in a phone-sized view): Standard mean1.77ms/p95 2.50ms; Illustrated0.97/1.40ms; Lite0.81/1.10ms. Observed frame intervals were about16.67ms on this runner. Native key event to next simulation/draw was6.6–11.4ms over five samples, **not** display latency. Cold initialization and real phones can differ substantially; final CI emits fresh profiles for each engine/executable. This is not a60fps certification.

Original PNG:2,046,890 bytes; decoded RGBA estimate6,291,456 bytes. The self-contained HTML is approximately5.10MB versus2.37MB before this image; base64 travels in the page even with Standard selected, while bitmap decoding is deferred. Runtime tile cache is bounded to four36×36 tiles. The full-size original is kept for review rather than silently recompressed; owner may authorize an optimized asset pass after visual acceptance. No WebGL migration is justified by these measurements.

See [owner instructions](owner-followup-playtest.md), [repair decisions](owner-followup-design.md) and [technical/human gaps](owner-followup-verification.md). The final Windows artifact's `build.json`, `candidate-inputs.json`, `VERIFICATION.md` and `SHA256SUMS.txt` identify the coordinated EXE/HTML build. No native phone package, deployment or public release is produced.

## Native comparison

Open images at their native size; screenshots are actual browser renders, not concept art composited over gameplay.

| View | Standard | Illustrated |
|---|---|---|
|844×390 landscape|[Standard](screenshots/sunny-meadow/standard-844x390.png)|[Illustrated](screenshots/sunny-meadow/illustrated-844x390.png)|
|960×540 desktop|[Standard](screenshots/sunny-meadow/standard-960x540.png)|[Illustrated](screenshots/sunny-meadow/illustrated-960x540.png)|

The evidence artifact also includes Lite, the exact owner-reviewed Stage H before images, all five powers, Guardian/Core fixture captures, normal-input video, original music WAV samples and raw performance results. Simulated routes and fixtures are labeled; human acceptance remains pending.
