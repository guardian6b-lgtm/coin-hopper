# CODEX HANDOFF — R6-E1A: Brick Hills illustrated-world pilot

**Assignment owner:** Codex (not FORGE). **Status:** Authorized to prototype one world for owner review; no production release.

## Why Codex owns this work

The successful Sunny Meadow Illustrated level was produced in the Codex-led workflow: the original landscape was generated using image_gen, and Codex integrated it with a Canvas2D layered background, parallax, authored midground/foreground, collision-aligned dimensional terrain, Standard/Illustrated/Illustrated Lite quality options, lazy decode and offline fallbacks. Its source and provenance are documented in `docs/sunny-meadow-prototype.md` and `docs/art/prototypes/sunny-meadow-provenance.json`. FORGE did not create that original integrated world in the documented workflow.

**Use the same technical approach and quality bar, not the same scenery.** Level 2 must be architecturally and visually distinct from Level 1.

## Source and isolation

- Repository: `guardian6b-lgtm/coin-hopper`
- Approved game baseline: R6-S4 gameplay commit `8c7049255f0b105ae969d3e1342a8b8bb995aaf1` (522/522 local and GitHub tests)
- Existing isolated design branch: `r6-e1/illustrated-worlds-prototypes`
- Read `docs/illustrated-worlds-prototype-plan.md`, this handoff, `docs/sunny-meadow-prototype.md`, and original art provenance before starting.
- Work in a new isolated local checkout or worktree, leaving S4 and main untouched. Check branch/working tree state first. No reset of other user work, no merge/tag/deploy/release.
- If the design branch is checked out, new work builds on its design-only commits. Prefer a separate candidate integration branch or worktree to protect the design baseline.

## Immediate R6-E1A deliverable: **Level 2, Brick Hills only**

Visual direction: sunlit terracotta highlands, genuinely connected ancient aqueduct arches and piers, honey limestone and red masonry, distant terraced villages and mesas, subtle moving water, warm afternoon light, dry grasses and sparse green accents. The palette, silhouettes, lighting, landmarks, and depth composition must be original and clearly different from Sunny Meadow's orchard, cream castle, and waterfalls.

1. First make a design comparison against Sunny Meadow's actual native game views: Level 1 Illustrated at 960×540 and 844×390, and Level 2 Standard at the same sizes. Identify the visual quality and legibility gap.
2. Create one original illustrated Brick Hills landscape using the same image generation method used for Level 1 if that facility is available to Codex; retain the original bytes, checksum and provenance. If image generation cannot be performed, provide a precise art request and stop at the missing-asset gate. Do not silently substitute a low-quality procedural drawing and declare visual success.
3. Build a fully playable, opt-in **Brick Hills Illustrated** prototype with far/background painting, parallax, distinct midground structures, restrained foreground layers and cohesive terrain/tiles; preserve the live scenery/collision distinction. Existing map data, platform edges, hero/enemy visibility, hazards, pickups and HUD must remain readable and unchanged mechanically.
4. Provide Standard, Illustrated and Illustrated Lite comparisons. Retain the existing Level 1 options and art, and leave Levels 3–6 pixel-identical to their current development state. Optional world prototype defaults OFF; invalid settings/storage/asset decoding fail safely to Standard. Preserve reduced-motion handling. No external CDN or runtime image fetch.
5. Capture actual game at 960×540, 844×390, and 390×844, including representative start, middle and end segments plus moving footage. Provide A/B screenshots against Level 1 for quality only. The foreground must not conceal spike/pit/solid boundaries, and the aqueduct supports must not look disconnected.
6. Run the existing `node --test` regression suite and focused isolation tests proving zero gameplay state, map, physics, camera framing, score, AI, abilities or HP changes. Measure bundle size, decoded memory and warmed render costs; state physical Android/iOS performance is untested unless actually exercised.
7. Preserve Walker, Ember and Shellback preview code/assets; Shellback default OFF; preserve their approved runtime values and R6-S4 checkpoint. Do not regenerate or replace characters or edit the canonical hero design.
8. Return one named **R6-E1A owner-review package** containing tested source branch+SHA, checksums, art/source manifests, before/after native screenshots, motion video/APNG, a local playable preview, exact test totals and an honest risks/limits table. Stop for owner visual acceptance. Do not roll the change to other levels automatically.

## Later gates (not authorized for integration yet)

Levels 3–6 deserve comparable quality but distinct identities: Level 3 astral observatory Starry Night, Level 4 luminous botanical Moonlit Gardens, Level 5 underground mineral-cathedral Crystal Caverns, Level 6 alpine Guardian sanctuary Skyline Summit. After a successful Level 2 technical/art review, make separate concept and integration review gates for each. Avoid five recolors of one plate and avoid generating all full-resolution worlds before the owner approves the workflow.

## Approval boundary

The owner authorized **Codex to resume this assignment**, beginning with the isolated Level 2 pilot. This is **not** approval to merge to `main`, change the game release, ship art to all levels, incur external paid-service charges, or alter any established physics.

Document owner decisions rather than inferring artistic approval from automated tests.
