
# Shellback R6-S1 development preview

The shared game already implements Shellback's 2 HP, 34×28 collider, 40 px/s patrol, wall/ledge reversal, 0.3-second hit guard, 0.4-second defeat cleanup and 50-point award. S1 reuses createEnemy, damageEnemy and the existing update loop.

The new, independent --enable-shellback-s1 flag defaults off. It replaces only Shellback's rendered body with the approved Master v1.0 intact/cracked native stills. HP 2 shows intact, HP 1 shows cracked, and defeat holds cracked with the existing runtime squash. No authored death or locomotion animation is available in this pack. HP pips and the existing hit flash remain visible.

~~~powershell
node scripts/ember-preview.cjs --enable-shellback-s1 --port 4174
~~~

The existing Ember/Walker flags can be supplied independently. This command uses the existing loopback server and adds no map markers or enemy placements. The regression harness creates isolated actors on a diagnostic floor for Shellback-specific checks.

The two PNGs and metadata are byte-identical to Shellback_Master_v1.0.zip, SHA-256 3aa4e1028026b48b7adabf09564dc5d2747dd3c568816624ef12669d2a932f02. Both images are 44×40 with pivot (22.023, 37.727). Drawn at native size, the foot pivot sits at the 34×28 collider's bottom center. The body mirrors around that anchor for left-facing movement.

The composer checks all three source hashes. The browser must decode both images at the expected dimensions before installing the renderer. Any validation or loading failure leaves the original procedural renderer active for all states. S1 adds no actor/save properties and changes no simulation functions.
