# Coin Hopper — R6-E1 Illustrated Worlds concept and prototype plan

**Status:** DESIGN STARTED / OWNER VISUAL REVIEW REQUIRED. Not production-locked or integrated.  
**Approved gameplay foundation:** R6-S4 `8c7049255f0b105ae969d3e1342a8b8bb995aaf1`.  
**Goal:** Give Levels 2–6 the depth, polish, and clarity of Sunny Meadow's illustrated Level 1 while ensuring **each world has its own original visual identity**. This is not a recolor, background replacement alone, or a copy of Sunny Meadow's compositions.

## Baseline and boundaries

Level 1 Sunny Meadow Illustrated provides the *quality bar and rendering structure*: original illustrated distant environment, independently layered midground atmosphere, simple foreground accents below the play line, parallax/depth, dimensional solid tiles aligned to the game's exact collision geometry, Standard/Illustrated/Lite options, reduced-motion behavior, and offline fallback. Keep Level 1's approved/reference artwork and pixels unchanged.

Preserve all six map layouts; level lengths, positions of pits, coins, platforms, enemies and boss; physics, collision, camera framing, score, progress, controls, audio, enemy timing and accessibility. R6-S4 Walker/Shellback/Ember preview paths and their default-OFF behavior must not be modified. No release, merge, title changes, or character regeneration.

## Level identity boards — no interchangeable plates

| Level | Original world concept | Visual identity and depth layers | Terrain/material vocabulary | Playability priority |
| --- | --- | --- | --- | --- |
| **2: Brick Hills** | **Sunbaked terracotta highlands and an ancient aqueduct** | Far amber mesas, terraced towns and heat-haze horizon; middle-distance brick aqueduct arches, stone water channels and distant windmills; near dry grasses/flowers and occasional masonry silhouettes | Worn red-brown brick, honey limestone, mortar, copper water, narrow green growth. Sunny warm late-afternoon light. Aqueduct supports must be connected, not floating dashes. | Solid platform edges, spikes and gaps must stand out against orange/ochre background; limit masonry clutter near player |
| **3: Starry Night** | **High-altitude astral observatory above a sleeping world** | Far indigo sky with original constellation patterns and a distant luminous horizon; middle floating observatory terraces, telescopes and star bridges; near restrained light motes, vapor and silhouetted plants | Midnight blue/purple stone, silvery moonlit edges, cool cyan accents, sparing gold pickup light | Readability of coins, player and platform edges at night; no fake platforms disguised as glowing structures |
| **4: Moonlit Gardens** | **Enchanted botanical terraces and luminous lily waterways** | Far moon, velvet mountains and dusky garden canopy; middle pergolas, water pools, stone arbors and hanging florals; near flowers/lanterns/fireflies kept below play line | Mossy jade stone, lavender foliage, pearl moonlight, warm lantern pockets, delicate reflective water | Read hopper jumps, shields and thorns/spikes clearly; avoid firefly effects resembling pickups |
| **5: Crystal Caverns** | **Immense subterranean mineral cathedral with underground streams** | Far vaulted shadows and pale mineral seams; middle colossal translucent crystals and slow luminous groundwater; near small facet reflections and stalagmite silhouettes | Layered slate, violet quartz, cyan crystal edges, wet rock and mineral dust; cool internal light rather than sky lighting | Sentinel projectiles and Shellback armor need high contrast; no bright faux hazards, obstructed cover or false floor edges |
| **6: Skyline Summit** | **Wind-carved alpine islands leading to an ancient Guardian sanctuary** | Far rolling cloud sea and towering distant peaks; middle weathered citadel fragments, elevated stone bridges and distinct island silhouettes; near rare grass, wind ribbons and restrained stone fragments | Pale granite, blue-gray slate, ancient carved masonry, bright sunlight against deep distant clouds. Boss arena shifts to monumental but uncluttered sanctuary | Nightwing charge and Stone Guardian vulnerability/stone debris must remain unmistakable; arena floor remains unobscured |

**Visual uniqueness rules:** Each level must have (1) its own silhouette and architectural grammar, (2) unique dominant material, (3) distinctive color/light direction, (4) a geographically plausible distant/middle/near scene, and (5) recognizable landmarks. No single plate reused with tint, crop, filters or decorative swaps. Maintain the approved cheerful/tactile illustrated Coin Hopper art language without copying Sunny Meadow's orchard, castle, bridges, composition, or scene elements into the other worlds.

## Rendering prototype approach

1. **Concept gate:** Produce one original concept/composition board per Level 2–6 at real gameplay framing, with a world landmark, far/middle/near layers and example terrain. Display a side-by-side gallery with Level 1 as the *quality benchmark* only. Obtain owner approval for each level's direction before final atlas/render treatment.
2. **Pilot — Level 2:** On a separate opt-in development preview, integrate Brick Hills only, using the established Sunny Meadow Canvas2D layered/world-painted technique, bounded tile caches, unmodified collision surfaces, no fetch/CDN. Show Standard versus Illustrated and Illustrated Lite at identical gameplay ticks. Leave Levels 3–6 pixel-identical for the pilot.
3. **After Level 2 approval:** Integrate Levels 3–6 individually in sequential review checkpoints. Each adds only that level's own art and tests, and receives separate owner sign-off. Avoid embedding/decoding all large worlds on initial page load; lazily decode current level and measure total offline HTML, peak memory and render/decode costs.
4. **Owner-quality gate:** Native gameplay captures at 844×390 mobile landscape, 960×540 desktop and 390×844 portrait; real moving footage, parallax, level start/mid/end, hazards, pickups, both hero and enemy legibility, Lite/reduced-motion/invalid storage/fallback. Compare against Level 1's *quality*, not its layout.
5. **Engineering gates:** Preserve original level definitions and game-state snapshots across modes; all existing Node regression tests; browser route/visual comparisons; report new bundle bytes, active bitmap memory, render profiles and any mobile acceptance gaps. Do not claim physical-device FPS without testing.

## Implementation constraints

- Keep Standard mode and the existing Level 1 Illustrated/Lite preference fully compatible. A new worlds-preview option must default **OFF**, remain reversible, and never silently change existing saved settings.
- Do not replace the world with a single static screenshot. Real platforms/enemies/coins/HUD remain live, accessible and aligned with gameplay.
- Preserve original source art, licensing/provenance notes and hashes. Use independently authored assets for each world.
- Keep the single-file offline Windows/browser packaging goal, but measure size and memory before choosing final formats; optimize only without visible quality regression.
- Do not modify approved Shellback or Walker character art, Ember previews, or the 522-test R6-S4 gameplay baseline.

## First deliverable for review

**R6-E1A concept gallery:** one labeled composition per level (2–6), the unchanged Level 1 reference alongside them, readable at natural 1× gameplay size, with a clear comparison of each environment's palette, landmarks, foreground/midground/background, platform texture and hazard contrast. No game integration yet. The owner chooses approve/revise per world. Next, implement the Brick Hills playable pilot and stop for review.

This plan does **not** claim the new levels have been rendered, approved, implemented, or tested.
