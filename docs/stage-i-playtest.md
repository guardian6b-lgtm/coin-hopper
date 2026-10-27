# Stage I art approval checkpoint

This is development work for Issue #30. It preserves Stage H and PR #29; it is not a release or acceptance sign-off. The existing five heroes remain in gameplay. The new Hopper is **concept-only**, including its limited single-image motion study. No replacement atlas is authorized until the owner approves the candidate.

## Open the review

Run `node scripts/serve-stage-i.cjs` from the checkout, then visit `http://127.0.0.1:8080/review`. A Windows CI bundle includes the same helper as `serve-preview.cjs`; run `node serve-preview.cjs`. The game is at `/`. Nothing is hosted or started automatically. To test a phone on the same trusted Wi-Fi, explicitly add `--lan`, and use the printed local address. Stop with Ctrl+C. No APK/IPA is supplied. A loaded game runs disconnected; a fresh LAN load needs this server.

The [review gallery](art/stage-i/index.html) contains the Hopper comparison, motion example, native C3 captures, a boss animation fixture, all five existing-hero gait clips and original Foley WAV/OGG samples. Files are bundled locally. The gallery can also be opened as a local HTML file in a browser that permits local relative assets; automated browser file-URL access was denied here, so use the local helper if needed.

## Hopper decision

Compare the original approved selection portrait and proposed painted portrait, then both at natural gameplay proportions. The current runtime sprite and the candidate are shown at 48px crown-to-ground height with an optional **unchanged 26×32 collision reference**. Native gameplay images are explicitly labeled: original live render versus a paused render-only overlay mockup. The second is not integrated gameplay.

The candidate retains the compact pink male mascot, short limbs, cream face, gold crown and cheerful expression, without hearts, eyelashes, humanoid anatomy, clothing or armor. It adds hand-painted surface variation, softer highlights and dimensional shading. Assess recognizability, originality, face/crown detail and mobile readability. The interactive walk/jump/idle examples articulate painted regions from this **one** portrait; full authored expressions/poses, a replacement atlas and integration wait for approval. The other four heroes keep their identities and current art. Rejected designs are excluded from the game and this approval choice.

## C3 Guardian and title

In the game, enable **Settings → Stage I preview — C3 Guardian and title**. This versioned preference defaults OFF and fails safely if storage is blocked. Sunny Meadow Illustrated remains independently selectable; there is no world-art rollout. The title preview uses existing hero artwork and configurable working-title text.

At Level6, inspect carved C3 on selected plates, exposed amber/crystalline anatomy, warning/throw/open/damage poses, low-HP steps and destruction. The retained 5HP, 68×64 collision, 2.8s vulnerability and one-hit-per-opening rules remain. The external green reticle is removed. Final-hit fracture/stagger, stones and dust settle over2.1 simulation seconds; non-colliding rubble remains below the walking line. Pause freezes the sequence. Checkpoint death preserves the unlocked exit/rubble; Restart/level load clears it. Reduced motion shows a static pile immediately. Source C3 lettering is never mirrored.

The video is a named low-HP combat fixture with an injected legal-opening final hit, not a human or normal-input completion run. Six-level/five-character no-power completion is independently replayed using legal recorded input. Native C3 engraving readability and artistic animation quality remain owner judgments; at gameplay scale detail is intentionally limited by the retained boss dimensions.

Listen to crack, rumble, opening, impact and footstep effects with Effects at0/25/100%, music independent and global mute; pause/blur must silence transient sounds. These are original synthesized effects. Full professionally arranged Meadow/Guardian music prototypes are deferred to the next listening approval gate; existing ten themes remain intact.

## Required human checks

- Physical Android Chrome and iOS Safari: safe areas/browser bars, multitouch move+jump+charged Ability, orientation, native readability, sustained performance/heat/battery and speakers/headphones.
- Human Windows NSIS/portable: installation/security prompts, physical controls/F11, DPI scaling, resize, persistence and audible mix. Automated Windows CI results must identify the exact commit; CI is not human acceptance.
- Owner: approve/revise Hopper **before** atlas/integration; judge C3 armor cues, source engraving readability, gait weight and collapse. The current separate pose articulation is a preview and may need polish after that review.

Use [the verification report](stage-i-verification.md) for PASS / FAIL / NOT TESTED. No merge, deployment, tag or release is authorized.
