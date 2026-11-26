
# Shellback S4 walking preview

The independent --enable-shellback-s1 flag remains OFF by default. The shared game retains 2 HP, its 34×28 collider, 40 px/s patrol, wall/ledge reversal, 0.3-second hit guard, 0.4-second defeat cleanup and one 50-point award.

~~~powershell
node scripts/ember-preview.cjs --enable-shellback-s1 --port 4174
~~~

The new runtime uses the owner-approved Shellback W1 v2.1 native intact/cracked strips, copied byte for byte from shellback_walkW1_v2.1_package.zip (SHA-256 8894309d6726e99ef7abd58dc2b6c36546d6c5b441969e1cb6ea480488fd5c15). Each strip has ten 56×40 RGBA cells. The exact shared pivot is (28.0234375, 37.7265625).

At the original 40 px/s patrol, every two resolved grounded world pixels advance one cell. That produces 20 fps, three 60 Hz updates per cell and a 0.5-second loop. Damage switches only the strip, preserving phase and pivot. A collision mirrors the art immediately using the resolved facing. Rooting, pause and airborne travel hold the current cell. Reduced motion holds the current phase while patrol continues. Newly spawned/reset actors use frame zero immediately.

Defeat holds the cracked cell under the existing runtime squash. The pack has no dedicated idle, airborne or death animation. Animation state is held in a WeakMap outside actor objects and saves. All approved PNGs remain unmodified. Only the two native strips and compact, pinned metadata were added as runtime assets. The original S1 master stills remain preserved.

The full original production ZIP, README, provenance, manifest, metadata and validation evidence are preserved outside the Git checkout under the S4 approved-package directory. Package timestamps/status wording predates the owner's November 26 approval, which is the authorization for this integration.

Floating HP dots remain removed. Invalid metadata/hashes, missing strips or failed image decode leave the ordinary procedural renderer active. Both strips must validate before the wrapper installs.

The authoring package includes one-pixel body dips on frames 3 and 8 and a one-pixel variation in lowest occupied sole rows. These remain part of the immutable artwork. At 20 fps artwork on a 60 Hz simulation, world travel continues by 2/3 pixel per update between held images. Native gameplay evidence and residual alignment measurements are reported outside the checkout for owner review.
