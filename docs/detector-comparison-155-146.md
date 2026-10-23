# Fingerprint Scan and CreepJS: three-browser comparison

Measured **24 October 2026, Asia/Jakarta**, Windows x64. **Silly Browser still fails both detector criteria in both modes.** Its captured results match the exact-version upstream Chromium control. The saved free CloakBrowser 146 binary passes the CreepJS criterion but scores **43/100** on Fingerprint Scan in both modes. The [sanitized summary](detector-comparison-155-146-summary.json) records exact checks, hashes, conditions and limitations.

No native functional inconsistency was reproduced. Ten local observation-control Node tests and four measurement-parser tests pass. The engine remains at **six C++ patches**, with all three runtime hashes unchanged. These local test passes do not constitute detector passes.

## Results and qualification

| Browser | Mode | Fingerprint Scan risk | CreepJS like headless | CreepJS headless | CreepJS stealth |
| --- | --- | --- | --- | --- | --- |
| Silly Browser 155.0.8059.80, patch six | Headed | **100/100** | 31% | **33%** | 0% |
| Silly Browser 155.0.8059.80, patch six | Headless | **100/100** | 38% | **100%** | 0% |
| Upstream-source Chromium 155.0.8059.80 | Headed | **100/100** | 31% | **33%** | 0% |
| Upstream-source Chromium 155.0.8059.80 | Headless | **100/100** | 38% | **100%** | 0% |
| Saved free CloakBrowser 146.0.7680.177 | Headed | **43/100** | 25% | 0% | 0% |
| Saved free CloakBrowser 146.0.7680.177 | Headless | **43/100** | 31% | 0% | 0% |

The previous acceptance criteria are retained: Fingerprint Scan below 10, and the reviewed CreepJS example's `headlessPct <= 30` plus `stealthPct <= 30`. The example prints a like-headless target, but does not include that percentage in its pass expression. Consequently CloakBrowser's headless 31% like-headless result still passes that CreepJS expression. There are **two detector passes, ten failures, zero unavailable results and zero collection errors** across twelve site observations.

The upstream 155 control is the separately rebuilt source control from the [exact-version comparison](stock-comparison-155-patch6.md), using unchanged artifacts and its existing generated GN graph. It is not an official binary distribution. The CloakBrowser binary comes from the verified saved free release `chromium-v146.0.7680.177.5`; its browser version omits the final distribution suffix. Both its launcher and DLL match the saved release receipt.

This is not a version-matched product comparison. The [latest release page queried for this report](https://github.com/CloakHQ/CloakBrowser/releases/tag/chromium-v155.0.8059.39.1-pro) describes Pro 155.0.8059.39.1 with a valid-key requirement. That Pro build was not tested. These measurements establish the saved free binary's results under the declared conditions, not the current product's results.

All three browsers use Python Playwright 1.62.0 directly, with the same 1920×1080 viewport, scale 1, fresh isolated context per site and the reviewed reference measurement functions. No product SDK launch defaults, proxy, humanization or explicit native fingerprint/locale/timezone options are supplied. The original example's fixed twenty- and thirty-second measurement waits are retained. Each engine/mode/site has one observation; order, site changes and network variation remain limitations. No user's profile was attached or reused.

## Exact observed failures

**CreepJS:** Silly and upstream headed runs trigger `webDriverIsOn`, while `hasHeadlessUA` and `hasHeadlessWorkerUA` are false. Their headless runs trigger all three. CreepJS's [published calculation](https://github.com/abrahamjuliot/creepjs/blob/master/src/headless/index.ts) reports the rounded fraction of true flags: one of three gives 33%, and three of three gives 100%. This explains the failing CreepJS headless percentages. Document and worker agree about the user agent in the owned controls.

The like-headless group has five true flags in both 155 headed runs: `prefersLightColor`, `noTaskbar`, `noContentIndex`, `noContactsManager` and `noDownlinkMax`. Headless adds `hasVvpScreenRes`. The saved CloakBrowser has the same three API-absence flags and light-color observation, with `noTaskbar=false`; its headless run also adds `hasVvpScreenRes`. These observations explain the different like-headless percentages. All five stealth checks are false in all six runs, including `hasBadWebGL`; this is a bounded heuristic result, not comprehensive graphics validation.

The [WebDriver interface](https://w3c.github.io/webdriver/#interface) defines an automation-status attribute for controlled browsers. Observing an active automation indicator under this launch is not itself a broken browser API. A lower result from another custom browser does not establish a native Chromium defect.

**Fingerprint Scan:** both 155 browsers display `Webdriver=true`, `Webdriver Writable=true`, `CDP Stack Check=true` and `CDP Check=true` in both modes. They display `Iframe Overridden=false`, `Selenium Properties=false`, `Playwright Flags=false` and `Chrome Driver Flags=false`. This run controls the pages with Playwright; it does not execute them through ChromeDriver.

| Displayed category | Silly / upstream headed | Silly / upstream headless | CloakBrowser, either mode |
| --- | --- | --- | --- |
| Hardware / OS | LOW | LOW | LOW |
| Browser | HIGH, +305 | HIGH, +480 | MEDIUM, +43 |
| Network / proxy | MEDIUM, +49 | MEDIUM, +50 | LOW, no displayed point value |

The saved CloakBrowser displays false for each of the selected boolean checks above. Its remaining 43 points are not assigned a verified per-check cause by this investigation. The [site describes a score combining several signal groups](https://fingerprint-scan.com/); the captured category totals and selected flags do not establish every internal weight or a counterfactual score if a flag changed. Neither these observations nor a screenshot prove all native checks have been recovered.

The reference helper's obsolete score element lookup returns `Score not rendered` on all six Fingerprint Scan observations. Our adapter independently requires the visible successful-collection state and parses the rendered numeric score. Missing, incomplete or invalid data cannot establish a pass; four parser tests cover completeness, invalid ranges and repeated conflicting check values.

## Native inconsistency investigation

An owned loopback fixture compares Silly with the exact upstream 155 control in each mode, under both configured viewport and native-window conditions. It queries the flagged API availability, checks document/frame/worker consistency, and verifies a real button action still works. The four paired comparisons all pass; all eight browser observations pass without a crash or uncaught page error.

| Condition, both 155 binaries | Screen | Available screen | Meaning of the observed gap |
| --- | --- | --- | --- |
| Headed, configured viewport | 1920×1080 | 1920×1080 | Zero under the configured context |
| Headed, native window | 1920×1080 | 1920×1032 | Real 48-pixel taskbar gap on this host |
| Headless, configured viewport | 1920×1080 | 1920×1080 | Zero under the configured context |
| Headless, native window | 800×600 | 800×600 | Default virtual screen in this run |

The `noTaskbar` observation follows the same mode/context behavior in both engines. [Playwright documents its viewport and screen emulation](https://playwright.dev/docs/api/class-browser#browser-new-context-option-viewport), including opting out of consistent viewport emulation for an OS-sized window. Native-window inner dimensions are recorded but excluded from strict paired equality because the OS controls them. No physical taskbar values are fabricated.

`ContentIndex` is undefined, and `navigator.contacts` / connection `downlinkMax` are absent, in every local 155 configuration. The saved CloakBrowser also reports those absences on the public page. An availability heuristic flag does not demonstrate an implemented API malfunction. Document/worker language, locale, timezone and user agent match; the frame exists and its `contentWindow` and navigator observations are consistent. The [earlier nine shared functional scenarios and twenty driver routes](stock-comparison-155-patch6.md) remain separately qualified.

No crash, uncaught page error, navigation failure or unexpected disconnect was captured in the twelve public observations. Diagnostics are limited to the selected event types and 64 records per observation; this is not an exhaustive network or engine audit. Exact six-patch checkout verification passes after the runs. No seventh patch or ChromeDriver binary change was justified by the reproduced behavior, and no compiler was started.

## Repeating the measurements

`benchmarks/compare_detector_observations.py` takes a private JSON engine list containing `id`, `executable`, `version`, `exeSha256` and `dllSha256`. It verifies each runtime before visiting either site and checks hashes again afterward. Provide the reviewed reference examples directory and a fresh output directory:

```powershell
python benchmarks/compare_detector_observations.py --engines PATH_TO_ENGINE_LIST.json --reference-dir PATH_TO_REVIEWED_EXAMPLES --output NEW_PRIVATE_EVIDENCE_DIRECTORY
```

Only hash-checked reference measurement functions are loaded; their launch/download code is not executed. A zero runner exit means complete collection without measurement errors, not that detector criteria passed. Read the report's separate status counts. Raw HTML/text/screenshots may contain IPs and identifiers and remain private.

For local controls, set `CUSTOM_BROWSER_EXECUTABLE`, `CUSTOM_BROWSER_CONTROL_EXECUTABLE` and a fresh `CUSTOM_OBSERVATION_CONTROL_REPORT`, then run `npm run test:observation-controls`. The parser checks run with `python tests/detector_observation_parser_test.py` in the configured Python SDK/Playwright environment. The sanitized summary binds source/report hashes to this execution. No native binary or package release was published.
