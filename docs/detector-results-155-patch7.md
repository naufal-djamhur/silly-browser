# Patch seven: Fingerprint Scan and CreepJS rerun

Measured **24 October 2026, Asia/Jakarta**, using the separate **155.0.8059.80 Windows x64 seven-patch candidate**. **Both sites fail the retained criteria in both display modes.** All four measurements completed; the collector reports 0 errors and 0 unavailable results. [Sanitized machine-readable evidence](detector-results-155-patch7-summary.json) binds the observations to the runtime and capture hashes.

## Scores

| Mode | Fingerprint Scan risk | CreepJS like headless | CreepJS headless | CreepJS stealth |
| --- | --- | --- | --- | --- |
| Headed | **100/100** | 31% | **33%** | 0% |
| Headless | **100/100** | 38% | **100%** | 0% |

The retained gates are Fingerprint Scan **below 10**, and the reviewed CreepJS example's **headless <= 30% and stealth <= 30%**. Its printed like-headless target is not part of its pass expression. These gates yield **0 passes / 4 failures**. A zero collector exit means successful measurement, not passing diagnostic criteria.

## CreepJS: the failing part

The main headless group reports these actual values:

| Published flag | Headed | Headless |
| --- | --- | --- |
| `webDriverIsOn` | `true` | `true` |
| `hasHeadlessUA` | `false` | `true` |
| `hasHeadlessWorkerUA` | `false` | `true` |

The [published CreepJS calculation](https://github.com/abrahamjuliot/creepjs/blob/master/src/headless/index.ts) turns the fraction of true flags into the headless percentage. The headed run has one of three true; the headless run has all three true. These explain the measured **33%** and **100%** and the failing headless criterion. This is a diagnostic classification under automation, not a reproduced timezone-validation failure.

The true like-headless observations are:

- **Headed:** `prefersLightColor`, `noTaskbar`, `noContentIndex`, `noContactsManager`, `noDownlinkMax`.
- **Headless:** `prefersLightColor`, `noTaskbar`, `hasVvpScreenRes`, `noContentIndex`, `noContactsManager`, `noDownlinkMax`.

The configured context reports `screen.height == screen.availHeight`, explaining the zero-taskbar-gap observation. API absence and light-color observations are heuristics, not proof that fonts, graphics or APIs malfunction. Prior same-version native-window controls are in the [patch-six comparison](detector-comparison-155-146.md); they were not repeated here.

**All captured stealth-group checks are false in both modes:** `hasIframeProxy`, `hasHighChromeIndex`, `hasBadChromeRuntime`, `hasToStringProxy`, `hasBadWebGL`. The **0% stealth result passes** the retained threshold; it does not establish complete graphics correctness or absence of other automation indicators.

## Fingerprint Scan: the published failing observations

Both the rendered page and the documented `window.FINGERPRINT_SCAN` interface report successful collection and the same numeric score. The public result provides these observations:

| Published check | Headed | Headless |
| --- | --- | --- |
| `webdriver` | `true` | `true` |
| `webdriverWritable` | `true` | `true` |
| `seleniumProperties` | `false` | `false` |
| `cdpStackCheck` | `true` | `true` |
| `playwrightFlags` | `false` | `false` |
| `chromeDriverFlags` | `false` | `false` |
| `automationKeysCheck.detected` | `true` | `true` |
| `iframe.cdpCheck` | `true` | `true` |
| `iframe.webdriver` | `true` | `true` |
| `iframe.iframeOverridden` | `false` | `false` |
| `worker.cdpCheck` | `true` | `true` |

The visible `CDP Check` values are also true in both runs. The additional public-object capture makes the iframe/worker context checks and `automationKeysCheck.detected` explicit; those structured fields were not saved by the previous patch-six collector. No historical equality is asserted for newly captured fields.

The site exposes these category reasons (points before its overall score cap):

| Category | Headed level / points | Headless level / points |
| --- | --- | --- |
| hardware | LOW / 0 | LOW / 0 |
| browser | HIGH / 305 | HIGH / 480 |
| network | MEDIUM / 49 | MEDIUM / 50 |

The **Browser HIGH** category accompanies the exposed WebDriver/CDP observations in both modes. Hardware contributes zero in these captures; network contributes supporting points even though this runner configured no proxy. The [site documentation](https://fingerprint-scan.com/docs) explains that it exposes category reasons while keeping some checks and weights private. These captures identify the published positive flags and category totals; they cannot assign every point to an individual rule or establish a counterfactual score after changing one flag.

## Conditions, comparison and native status

The runner uses Python Playwright **1.62.0** directly, a **1920×1080** viewport, scale **1**, fresh isolated context per site, and the reviewed reference helper's original 20-second / 30-second waits. No product SDK launch defaults, explicit locale/timezone/identity options, proxy or pacing are supplied. ChromeDriver is not used in these four site measurements. Raw public objects/screenshots/text remain private because they contain identifiers and network details.

The scores, captured CreepJS flags and previously selected rendered Fingerprint Scan checks match the saved patch-six observations. This is a comparison to historical captures, not a fresh paired stock/reference experiment. Stock Chromium and CloakBrowser were not rerun in this iteration. No observed score improvement follows from patch seven in this run.

Patch seven fixes an invalid-CDP-timezone-update state defect; these public diagnostics do not establish that they exercise that invalid-input sequence. The [four-case timezone regression, 106 Node checks, five Python checks and ten driver routes](cdp-timezone-validation-155.md) remain separate measured compatibility evidence. No new C++ or ChromeDriver patch is added by this diagnostic rerun.

Captured diagnostics: **0 page crashes**, **0 uncaught page errors**, **0 navigation failures**, **0 unexpected disconnects**. Four parser checks pass. The runtime hashes and exact seven-patch checkout verify after measurement. No compiler was started.

| Runtime artifact | SHA256 |
| --- | --- |
| chrome.exe | `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052` |
| chrome.dll | `4791896fcfe854ffd50d14cf88f51857967b8159995ba346f61b5a14183de526` |

Collector: [compare_detector_observations.py](../benchmarks/compare_detector_observations.py). The public-interface capture is taken after the site's own measurement completes. The run uses the reviewed reference measurement functions only; the reference launch/download code is not executed.
