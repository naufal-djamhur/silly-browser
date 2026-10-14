# Requested reference tests — 15 October 2026

The four requested examples were assessed using the actual preserved Windows Chromium **146.0.7680.177** runtime, in both headed and headless modes. **The requested overall pass and Fingerprint Scan score below 10 were not achieved.**

The [sanitized results](reference-test-summary.json) bind these observations to the executable and runtime DLL hashes. The runtime contains two compiled patches; local candidate patches and the separate stable source line were not compiled or exercised by this iteration.

## Results

| Requested example | Headless | Headed |
| --- | --- | --- |
| `basic.py` | Pass: Example Domain loads | Pass: Example Domain loads |
| `fingerprint_scan_test.py` — Fingerprint Scan | Fail: 100/100 | Fail: 100/100 |
| `fingerprint_scan_test.py` — CreepJS | Fail: headless 100%, stealth 0% | Fail: headless 33%, stealth 0% |
| `recaptcha_score.py` | One verified 0.9 response; subsequent attempt unavailable | Both attempts unavailable |
| `stealth_test.py` | Fails; incomplete variants remain unqualified | Fails; incomplete variants remain unqualified |

The reference CreepJS comparison accepts at most 30% for both headless and stealth metrics. The like-headless observations were 38% and 31% respectively. These are distinct metrics, not a Fingerprint Scan score.

The stealth suite produced these observations:

| Subtest | Headless | Headed |
| --- | --- | --- |
| Sannysoft | 52/56 reference checks pass; overall fail | 55/56 reference checks pass; overall fail |
| Incolumitas | 30/36 reference checks pass; overall fail | 32/35 reference checks pass; overall fail |
| Rebrowser | 3 failures, 3 untriggered out of 10 | 3 failures, 3 untriggered out of 10 |
| DeviceAndBrowserInfo | `isBot=true` | `isBot=true` |
| BrowserScan | Captured; verdict unqualified | Captured; verdict unqualified |
| CreepJS noise-off variant | Reference launch option unsupported | Reference launch option unsupported |

The upstream Incolumitas comparison excludes two named failures; it still fails on these runs. BrowserScan's upstream text parser found 17 occurrences of Normal and no Abnormal occurrences in each mode. Word counts alone are insufficient to qualify the site's full verdict, so no verified BrowserScan pass is claimed. Untriggered Rebrowser checks are not passing coverage.

## What was executed and adapted

The pinned reference revision is [`fbf005bc199920b592df17ac4d489324e29d56d8`](https://github.com/CloakHQ/CloakBrowser/tree/fbf005bc199920b592df17ac4d489324e29d56d8/examples). All four requested example blobs match that revision. Only their reviewed measurement functions and comparison definitions were loaded, avoiding reference module code that downloads and launches CloakBrowser's binary.

Our [measurement runner](../benchmarks/reference_measurements.py) uses the actual custom executable, redirects captures to a dedicated local run folder and adds availability checks. The basic navigation and reCAPTCHA demo flows use equivalent operations from the reviewed examples. Unsupported reference screen/timezone/GeoIP/noise options are omitted and are not qualified. Each case uses a fresh incognito context with a 1920×1080 application viewport; humanized input and proxies were disabled. The examples primarily observe fingerprints and classifications; these runs do not qualify a human-like input model or every behavioral detector.

This is one full run per display mode and one additional reCAPTCHA-only attempt per mode. It is not a repeated-release qualification. The raw captures and logs remain under `artifacts/reference-examples/` and are excluded from GitHub.

## Collector correction and separate compatibility evidence

The initial source-hash guard stopped before browser launch because the local Git checkout had Windows line endings. Canonical LF comparison resolved that format mismatch; it was not a browser failure.

The initial reCAPTCHA collector classified the headless observation before its response callback appended a valid backend response. The original report is preserved. Its recorded payload establishes one successful 0.9 demo observation, while the sanitized summary exposes both the initial collector status and the derived verdict. The collector now explicitly waits for the verification response before classification. The subsequent headless and headed attempts timed out without a verified score, so reliable reCAPTCHA outcomes are unqualified. The demo's own notice warns that its scores do not represent production traffic.

Separately, this session reran **28 JavaScript engine checks, five Python engine checks and ten driver smoke checks**, all passing on the same historical runtime. The committed source snapshot was used for historical engine qualification so the unpublished four-patch local manifest was not mistaken for a compiled two-patch build. Compatibility evidence is retained under `artifacts/e2e-parity/20261015-historical/qualification/`; it does not establish detector success.

No browser C++ changes were made, no new native build was started, and no passing detector result was inferred from a successful launch or missing data. The next allowed engineering work remains actual build qualification and repair of reproducible correctness, compatibility or documented privacy-policy defects. Work to conceal automation to defeat anti-bot/CAPTCHA protections is outside this continuation.

## Repeat the measurements

Run from the project root with Python Playwright and the project Python SDK installed. Supply a reviewed reference examples directory matching the pinned blobs and the actual built executable:

```powershell
python benchmarks/reference_measurements.py --executable 'PATH_TO_CUSTOM_CHROME.exe' --reference-dir 'PATH_TO_REFERENCE/examples' --output 'artifacts/reference-examples/NEW_RUN-headless'
python benchmarks/reference_measurements.py --executable 'PATH_TO_CUSTOM_CHROME.exe' --reference-dir 'PATH_TO_REFERENCE/examples' --headed --output 'artifacts/reference-examples/NEW_RUN-headed'
```

Use a new output directory for each attempt. `--only recaptcha` selects the demo alone. A nonzero exit after completed measurements means that required outcomes did not pass; inspect the report rather than treating that exit as a native build failure.

Reference files: [basic](https://github.com/CloakHQ/CloakBrowser/blob/fbf005bc199920b592df17ac4d489324e29d56d8/examples/basic.py), [fingerprint measurements](https://github.com/CloakHQ/CloakBrowser/blob/fbf005bc199920b592df17ac4d489324e29d56d8/examples/fingerprint_scan_test.py), [reCAPTCHA demo flow](https://github.com/CloakHQ/CloakBrowser/blob/fbf005bc199920b592df17ac4d489324e29d56d8/examples/recaptcha_score.py), [detector suite](https://github.com/CloakHQ/CloakBrowser/blob/fbf005bc199920b592df17ac4d489324e29d56d8/examples/stealth_test.py).
