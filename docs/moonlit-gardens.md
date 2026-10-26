# Stage 3: Moonlit Gardens

The subsequent [final technical verification](stage-3-final-verification.md)
records Windows x64 builds/executable smoke tests, platform reachability review,
temporary artifact links, and the remaining human acceptance gates. The results
below describe the initial Stage 3 implementation pass.

Implements GitHub Issue #2 on `codex/moonlit-gardens`, starting from validated base
`2edca54aafa5b0bf5d4afa9d9981bb429fc33126` (`codex/gameplay-menus`). The draft PR
targets that branch. No Levels 5/6, music, movement changes, or release work are included.

## Level and enemy

Moonlit Gardens follows Starry Night and precedes the four-level win screen. Its
108-column layout has five pits, raised lavender platforms, flower-topped garden
ground, a crescent, fireflies, 24 coins, four hoppers, two walkers, and two shields.
It introduces a shield on a safe stretch before the first hopper, then mixes
spike groups, gaps, and enemy timings. Elevated coins reward optional platform
routes; collecting every coin is not required to reach the flag.

Mint hoppers have leaf-shaped ears, broad feet, and gold eyes. They patrol at the
existing walking speed, turn at grounded edges/walls, and hop using fixed timing:
first launch after 0.7 seconds, then every 0.95 seconds when grounded. Their launch
speed is 420 px/s upward with the existing enemy gravity. Their rhythm freezes
while paused, including Settings/Controls; restart recreates it. Stomping a hopper
uses the existing 50-point award, held/released bounce, and 0.4-second defeat cleanup.
Walkers in the first three levels retain their original behavior.

## Shield rules

- Cyan shield pickups grant one hit of protection with no score or life award.
  The player gets a cyan bubble and a SHIELD HUD label.
- A damaging walker/hopper side hit or spike hit consumes protection, preserves
  position/lives/score, and gives one second of recovery invulnerability. The
  simulation ends that hit's tick, preventing another hazard/award in that tick.
- Existing spawn/recovery invulnerability does not spend a shield. Stomping enemies
  does not spend it. There is no stacking: a second pickup stays available until
  the current shield is gone.
- Falling bypasses both shield and recovery protection and costs a life. Protection
  clears on death, completion, restart, or starting another level/run.
- Consumed pickups stay consumed after a death, like collected coins. Restart
  recreates pickups and enemies, removes only that level's earned points, and
  preserves remaining lives and earlier-level points. Cancel preserves protection.
- Keyboard and touch use the same automatic pickup/collision rules; no new action
  button or key is required. Existing effects use the effects-volume bus.

## Verification

Application commit verified: `4874424179af95f6222bbd1ab8ec5784b2d9c5f8`.
The follow-up verification-record commit changes documentation only.

Draft PR: [#3](https://github.com/guardian6b-lgtm/coin-hopper/pull/3), targeting
`codex/gameplay-menus` and referencing Issue #2.

[Download the hosted playable preview](https://github.com/guardian6b-lgtm/coin-hopper/actions/runs/40408802660/artifacts/12692431533)
(available according to the workflow's seven-day retention). Extract and open
`index.html`; no release or deployment is involved.

Use Node.js 22 or newer from the repository root:

```sh
node --test
```

The full dependency-free suite passes **64 tests** on Node 24.19.0, with zero
failures/skips. It preserves the first three map hashes and movement/scoring tests,
covers the new enemy/shield/state transitions, and replays all four maps using
keyboard transitions without editing the world or player. A continuous run reaches
Win with all three lives and no shield pickup. The Moonlit Gardens route reaches
the flag in 847 simulation ticks (about 14.1 seconds), without damage or protection.
`tests/fixtures/routes.cjs` contains the input recordings; these prove reachability,
not subjective difficulty or human playtest quality.

Optional browser verification requires Playwright to be available to Node:

```sh
node scripts/verify-browser.cjs
```

The cloud environment supplies Playwright 1.62.0 and Chromium 154.0.8037.57. Other
machines can install Playwright as a local development tool and its Chromium
browser before running the script. `CHROMIUM_PATH` selects a system executable;
`COIN_HOPPER_TEST_OUTPUT` selects the screenshot/results directory (default:
`coin-hopper-browser-check` under the system temporary directory). The script
starts its own loopback server and closes it and its browsers afterward.

Performed checks:

| Check | Result | Scope |
| --- | --- | --- |
| Node suite | PASS | 64 tests; original maps/physics/scoring and new mechanics/transitions. |
| Browser route replay | PASS | Real Chromium keyboard handlers and Canvas2D; all four levels in sequence without damage/shields, then Win. Scheduler is manually stepped at fixed 60 Hz for deterministic replay. |
| Live browser mechanics | PASS | Real-time keyboard pickup, bubble/HUD, shield absorption, pit death, pause/settings/resume, restart and portrait/landscape resize. Hazard/end-state fixtures are set only in runtime, not shipped source. |
| Simulated mobile | PASS | CDP multi-touch movement/jump, shield pickup, cancellation, pause/resume and landscape-to-portrait resize. |
| Visual inspection | PASS | Screenshots of moonlit scenery, recognizable hopper, shield indicator, mobile rendering and completion screen; no page JavaScript errors. |
| Linux Electron package | PASS | Unpacked build and offline packaged launch; Windows config/app files remain compatible and unchanged. See commands below. |
| Windows build/execution | NOT TESTED | Requires Windows; no Windows runtime or Wine available here. |
| Physical phones, speaker listening, human balancing | NOT TESTED | Automation and signal routing do not establish physical-device comfort, audible quality, or perceived difficulty. |
| Hosted CI/artifact upload | PASS | [Run 40408802660](https://github.com/guardian6b-lgtm/coin-hopper/actions/runs/40408802660): Node 22 gameplay checks passed on Ubuntu and Windows. The playable HTML/instructions artifact is uploaded. Its metadata was verified; downloading hosted bytes from this environment is blocked by the artifact-storage proxy. |

Desktop package verification uses the existing copy/build configuration with no
release publishing. In `desktop/`, after the normal lockfile dependency install:

```sh
npm run copy-index
cmp ../index.html index.html
XDG_CACHE_HOME=/workspace/.cache \
ELECTRON_CACHE=/workspace/.cache/electron \
ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder \
NODE_USE_ENV_PROXY=1 \
node_modules/.bin/electron-builder --linux --dir --publish never \
  --config.electronDist=node_modules/electron/dist
```

The game page remains one offline HTML file, so the existing Windows app includes
all new artwork and mechanics through `copy-index`. No new runtime packages, asset
downloads, secret requirements, or Electron permissions are needed. The gameplay
workflow continues to test Node 22 on Linux and Windows and uploads the standalone
page plus [preview instructions](preview.md); it does not publish releases.

Before final approval, play all four levels normally, assess hopper timing and
shield placement, test real mobile controls/orientation, listen at zero/intermediate
effects volume, and build/launch the NSIS/portable Windows apps without publishing.
Check offline operation, storage, F11 and resize on Windows. These manual checks
remain distinct from the passing Node and headless browser verification.
