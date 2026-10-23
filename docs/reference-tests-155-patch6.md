# Patch-six reference examples and native investigation — 24 October 2026

The exact six-patch **155.0.8059.80 Windows x64** runtime was measured in both modes. **The overall example/detector benchmark still fails.** Each mode has three passing, six failing, one unqualified and one unsupported workflow/subtest observations. These are category counts, not a weighted score.

| Workflow | Headed | Headless |
| --- | --- | --- |
| Basic navigation | Pass | Pass |
| Persistent profile, two launches | Pass | Pass |
| Fingerprint Scan | Fail: 100/100 risk | Fail: 100/100 risk |
| CreepJS | Fail: headless 33%, stealth 0% | Fail: headless 100%, stealth 0% |
| reCAPTCHA v3 public demo | Verified 0.9 | Verified 0.9 |
| Sannysoft | Fail: 55/56 | Fail: 52/56 |
| Incolumitas | Fail: 32/35 | Fail: 30/36 |
| Rebrowser | Fail: 6 failing entries | Fail: 7 failing entries |
| DeviceAndBrowserInfo | `isBot=true` | `isBot=true` |
| BrowserScan | Captured, unqualified | Captured, unqualified |
| CreepJS noise-off | Unsupported configuration | Unsupported configuration |

The [sanitized evidence](reference-tests-155-patch6-summary.json) includes exact check labels, raw-report/source digests, the old/new comparison and limitations. Headline workflow statuses and metrics are unchanged from [patch five](reference-tests-155.md). No proxy was configured, so the new native proxy-auth feature was inactive during these external workflows. No detector tuning, solver, driver patch or native rebuild was used.

## Exact reported failures

**Fingerprint Scan:** 100 exceeds the reference requirement of less than 10 in both modes. The helper additionally reports `CDP Check: true`. Its aggregate risk score is not a full causal trace of the site's model.

**CreepJS:** only `headlessPct` exceeds the reference 30% threshold: 33% headed, 100% headless. Stealth is 0% in both; that separate metric does not make the overall criterion pass. Like-headless is 31% headed and 38% headless. The page reports `webDriverIsOn=true` in both modes and the two headless-UA flags in headless mode. Other reported signals are retained in the JSON as observations, not engine defects.

**Sannysoft:**

- Headed: `WebDriver (New)`.
- Headless: `User Agent (Old)`, `WebDriver (New)`, `HEADCHR_UA`, `CHR_MEMORY`.

**Incolumitas:**

- Headed: `webdriverPresent`, `webDriver`, `WEBDRIVER`.
- Headless: `webdriverPresent`, `userAgent`, `webDriver`, `HEADCHR_UA`, `WEBDRIVER`, `CHR_MEMORY`.

The reference excludes `WEBDRIVER` and `connectionRTT`; other failed entries remain, so both modes fail that intended criterion.

**Rebrowser:**

- Headed: `sourceUrlLeak`, `runtimeEnableLeak`, `navigatorWebdriver`, `ipcFloodingProtection`, `useragent`, `storagePartitioning`.
- Headless: `sourceUrlLeak`, `runtimeEnableLeak`, `navigatorWebdriver`, `ipcFloodingProtection`, `useragent`, `headless`, `storagePartitioning`.

Each mode also has three untriggered and one unclassified entry. Those entries do not establish passes.

**DeviceAndBrowserInfo:**

- Headed true detail flags: `hasWebdriverTrue`, `hasWebdriverInFrameTrue`, `hasInconsistentTimingResolution`, `isAutomatedWithCDP`, `isAutomatedWithCDPInWebWorker`.
- Headless true detail flags: `hasBotUserAgent`, `hasWebdriverTrue`, `hasWebdriverInFrameTrue`, `hasInconsistentTimingResolution`, `isAutomatedWithCDP`, `isAutomatedWithCDPInWebWorker`.

**BrowserScan:** its capture includes a Robot label, while its reference helper merely counts Normal/Abnormal words. That counter is insufficient for a qualified passing verdict or exact structured subcheck coverage. **Noise-off:** this engine does not support the reference flag, so a returned `totalLies=0` is not qualification of that configuration.

## Measurement issue repaired

The reviewed DeviceAndBrowserInfo helper returned an empty `checks` map despite 22 rendered boolean details. Its dynamically constructed JS regular expression loses the whitespace escape. This was reproduced offline using the hash-guarded helper and saved text. Our adapter now parses the rendered JSON with bounded standard-library decoding, retaining the original helper result separately. Five parser tests pass, and targeted live rechecks in both modes collect all 22 flags. Both verdicts remain failures. The original full-run reports and the exact executed runner snapshot are preserved; the later parser repair has separate source and recheck evidence.

## Native correctness investigation

**No reproducible native Chromium defect was established in the tested scope.** The six-patch runtime passes 18 local functional tests: sixteen observations across eight scenarios and their paired comparison. Native Ahem layout, canvas/worker readback, WebGL readback, offline audio, Unicode editing, scrolling/frame input, popup lifecycle and IndexedDB/worker configuration agree between modes. All four persistence launches pass.

External page-error diagnostics showed zero-argument `sendBeacon` and legacy `getUserMedia` calls, plus an undefined `frames` property read. Owned local reproductions pass in both display modes on Silly Browser and installed stock Chrome **156.0.8078.47**: the calls throw TypeError, and the renderer remains usable. Chromium 155's checked IDL declarations require a URL for `sendBeacon` and three arguments for the legacy media method. These exceptions are consistent with required-argument validation. The undefined-property error is also reproducible with undefined input; the third-party site's variable/data flow remains untraced, so its exception text alone does not identify an engine fault.

The stock control is an adjacent version, not an independently built stock 155 control. No page crash, unexpected browser disconnect or navigation-request failure was recorded by the selected diagnostics. This is bounded evidence, not a complete audit. No C++ or ChromeDriver patch was justified, and compilation stayed stopped. The external workflows use our Python SDK and Playwright; they do not execute ChromeDriver.

## Provenance and continuation

The reference checkout is `160f56da85860e89f0e7d9bfdc80266b984057d5`; all five canonical Git blobs match the prior review. The old runner review pin is retained separately. Fresh isolated contexts, 1920×1080 viewport, no proxy and no humanized input were used once per mode. No unsupported identity/GeoIP/noise flags were added. A separate fresh profile per mode was reopened for persistence. The reCAPTCHA score is one successful public-demo backend observation per mode, not production acceptance.

Executable SHA256: `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052`. Runtime DLL SHA256: `951fbc14ffb40db20aff024f69f6c0c743cabe2fb63c33d67d1e673b53f44ece`. Both remained unchanged. The existing exact six-patch source checkout verifies again. Raw captures, logs, live reports and owned profiles remain ignored under `artifacts/reference-examples/20261024-155-patch6/`; no user's browser/profile was attached or reused.

Use `benchmarks/reference_measurements.py` and `benchmarks/reference_persistence.py` with an explicit six-patch executable, the pinned examples directory and new output directories. The new `--only deviceandbrowserinfo` selection reproduces the collector correction without repeating the full suite. `tests/web-api-contract-browser.test.mjs` uses `CUSTOM_BROWSER_EXECUTABLE`, optional `CUSTOM_BROWSER_CONTROL_EXECUTABLE` and `CUSTOM_WEB_API_CONTRACT_REPORT`; `tests/reference_result_details_test.py` runs offline. Continue from a concrete valid-input functional regression or another ready MVP gate; detector labels alone do not specify a native patch.
