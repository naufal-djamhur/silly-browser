# Patch six versus upstream Chromium 155.0.8059.80

Measured **24 October 2026, Asia/Jakarta**, Windows x64. **61 Node tests and 20 driver smoke checks pass, with no skips or failures.** Nine shared functional scenarios produce equal application results across both engines and both modes. No native defect was reproduced, so the qualified engine remains at **six C++ patches**. The [machine-readable summary](stock-comparison-155-patch6-summary.json) binds the results to source and binary hashes.

## Exact-version control

Both browsers report **155.0.8059.80** and use upstream revision [`43a195105613ac83c21d3f14de279f4a045c7da0`](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.80). This replaces the adjacent-version Chrome 156 control used in the [previous API investigation](reference-tests-155-patch6.md).

The control is a **locally rebuilt upstream-source runtime**, not an official binary distribution. All ten modified C++ translation units were recompiled from pristine Git blobs, using a Clang virtual filesystem overlay and the same compiler/build settings. Three affected thin archives were reconstructed and a separate DLL linked. The remaining unchanged artifacts and generated GN graph were reused. The GN additions retained in that graph are header declarations and direct dependency edges; no custom headers appear in the pristine compilation logs. This is an incremental source control, not a clean-from-scratch or bit-for-bit official build.

The build uses `is_debug=false`, `is_component_build=false`, `symbol_level=0`, `is_official_build=false`, `target_cpu="x64"`. The successful incremental control build took approximately **158 seconds**, including queries, compilation, linking and staging. This duration does not estimate a full Chromium build. The existing checkout, original objects/libraries and five- and six-patch runtimes remain unchanged. Exact six-patch checkout verification passes afterward.

| Runtime | Native custom patches | `chrome.dll` SHA-256 |
| --- | --- | --- |
| Upstream-source control | 0 | `e719c01be39b2aff0903480bdd209b2f5cc03894691f64c3dff7261c8b6683c1` |
| Qualified patch six | 6 | `951fbc14ffb40db20aff024f69f6c0c743cabe2fb63c33d67d1e673b53f44ece` |

Both use the unchanged launcher EXE, SHA-256 `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052`; the DLL identifies the different engines. Both local builds return a zero CDP revision string. Source revision qualification therefore comes from the Git blobs, object/build receipts and runtime hashes, not the CDP revision text. That distribution metadata remains a release qualification concern.

## Shared functional comparison

Each scenario runs once per engine/mode combination with a fresh isolated context, 960×720 viewport, device scale 1 and native environment defaults. Both report `en-GB` and `Asia/Jakarta` in document and worker. Ahem is served by the owned loopback HTTP fixture as a web font, giving stock Chromium the same font without a custom loader. Neither engine receives identity overrides, native locale/timezone switches, humanization or a proxy in this comparison.

| Scenario | Stock headed | Stock headless | Patch six headed | Patch six headless |
| --- | --- | --- | --- | --- |
| Valid `sendBeacon` request delivered with its UTF-8 body | Pass | Pass | Pass | Pass |
| CSS geometry and Ahem text advance | Pass | Pass | Pass | Pass |
| Canvas and worker OffscreenCanvas pixel readback | Pass | Pass | Pass | Pass |
| WebGL clear/readPixels and error state | Pass | Pass | Pass | Pass |
| Offline audio gain across 128 samples | Pass | Pass | Pass | Pass |
| Unicode editing, Tab order and activation | Pass | Pass | Pass | Pass |
| Nested scrolling and iframe editing | Pass | Pass | Pass | Pass |
| Popup navigation, closure and surviving opener | Pass | Pass | Pass | Pass |
| IndexedDB reopen, worker defaults and HTTP language | Pass | Pass | Pass | Pass |

All **36 scenario observations** pass, and all **27 comparisons** against stock headed results agree. No crash or uncaught page error was captured in these scenarios. The shared fixture contributes 38 Node tests, including its parent and comparison test.

## Previously observed errors and custom configuration

The three invalid operations from the earlier page-error investigation behave identically across all four engine/mode combinations: `navigator.sendBeacon()` raises the required-URL TypeError, zero-argument legacy `navigator.getUserMedia()` raises the required-three-arguments TypeError, and reading `undefined.frames` raises TypeError. Every renderer remains usable afterward. These four browser observations contribute five Node tests. The valid beacon scenario above also verifies successful API use and actual receipt at the owned server.

This establishes the behavior of those operations. It does not trace which third-party variable became undefined or exclude a different defect elsewhere on that page.

Separately, the existing patch-six fixture passes **16 observations and eight headed/headless comparisons**, contributing 18 Node tests. It exercises native `fr-FR` locale, `Europe/Paris` timezone/DST and the Windows Ahem font-directory integration alongside its functional contracts. Those explicit custom configuration features are not required of the stock control. See their original [qualification scope](native-http-proxy-155.md).

## Driver comparison

All five smoke routes pass on each browser in both modes: JavaScript Playwright SDK, Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver. That is **20 passing routes**. They exercise local navigation, input, iframe access, storage across reload and protocol connection; they do not qualify every driver operation or persistent-profile relaunch.

Versions: Node 24.22.1, JavaScript Playwright 1.62.1, Puppeteer 25.13.0, Python Playwright 1.62.0 and Selenium 4.51.0. Selenium uses **ChromeDriver 155.0.8059.84** against the **155.0.8059.80** browsers. The stock SDK routes select baseline mode; the custom routes verify the six-patch handshake. No ChromeDriver binary was modified. Both runtimes retain their expected EXE/DLL hashes after the entire sequence.

## Repeating the comparison

Set `CUSTOM_BROWSER_EXECUTABLE` to patch six, `CUSTOM_BROWSER_CONTROL_EXECUTABLE` to the verified exact-version upstream control, and `CUSTOM_BROWSER_FONT_TEST_DIR` to a directory containing Chromium's licensed `Ahem.ttf` test fixture. Set `CUSTOM_STOCK_PARITY_REPORT` to a new evidence path, then run:

```powershell
npm run test:stock-parity
```

The fixture refuses a mismatched browser version. To repeat the invalid-call controls, run `node --test tests/web-api-contract-browser.test.mjs` with those executable variables and a fresh `CUSTOM_WEB_API_CONTRACT_REPORT`. The custom-only checks use `npm run test:functional-parity` and `CUSTOM_FUNCTIONAL_PARITY_REPORT`. Use `compatibility/run.mjs --both-modes` with `--engine-mode baseline` for stock and `--engine-mode custom` for patch six; provide separate outputs and the Python executable as needed.

Raw reports, logs and build receipts are retained privately; their hashes and source hashes are in the summary. No user profile was attached or reused. No native binary or package release was published.

This is one deterministic comparison on one Windows x64 host. WebGPU, real-time audio/camera, broader font fallback, host environment change notifications and other operating systems are outside this run. Fingerprint Scan, CreepJS and the other external detectors were not rerun; their [previous failures](reference-tests-155-patch6.md) remain recorded. Passing these functional checks establishes neither universal engine parity nor a detector score improvement.
