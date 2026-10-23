# Chromium 155 reference examples — 23 October 2026

The five requested CloakBrowser example workflows were assessed on the completed **155.0.8059.80 Windows x64** runtime in headed and headless modes. **The overall detector benchmark does not pass.** Basic navigation and persistent profiles pass in both modes; the public reCAPTCHA demo returned one verified score of **0.9 per mode**.

The [sanitized results](reference-tests-155-summary.json) bind these observations to the exact executable/DLL pair from [48 passing local integration checks](engine-validation-155.md). This is new 155 evidence; [historical 146 results](reference-tests-prestable.md) remain separate.

## Measured results

| Workflow or subtest | Headless | Headed |
| --- | --- | --- |
| `basic.py` | Pass: Example Domain title | Pass: Example Domain title |
| `persistent_context.py` | Pass: cookie/localStorage restored after restart | Pass: cookie/localStorage restored after restart |
| Fingerprint Scan | Fail: 100/100 bot risk; target below 10 | Fail: 100/100 bot risk; target below 10 |
| CreepJS | Fail: headless 100%, stealth 0% | Fail: headless 33%, stealth 0% |
| reCAPTCHA v3 public demo | Pass: backend success, score 0.9 | Pass: backend success, score 0.9 |
| Sannysoft | Fail: 52/56 reference checks pass | Fail: 55/56 reference checks pass |
| Incolumitas | Fail: 30/36 reference checks pass | Fail: 32/35 reference checks pass |
| Rebrowser | Fail: 7 failures, 3 untriggered, 20 total entries | Fail: 6 failures, 3 untriggered, 20 total entries |
| DeviceAndBrowserInfo | Fail: `isBot=true` | Fail: `isBot=true` |
| BrowserScan | Captured, verdict unqualified | Captured, verdict unqualified |
| CreepJS noise-off variant | Unsupported reference launch option | Unsupported reference launch option |

Each mode has **3 passing, 6 failing, 1 unqualified and 1 unsupported** workflow/subtest observations. These counts are not a weighted detector score. `fingerprint_scan_test.py` and the complete `stealth_test.py` suite do not pass in either mode.

CreepJS uses the reviewed comparison of at most 30% for both headless and stealth; its separate like-headless metric was 38% headless and 31% headed. Incolumitas still fails after applying the reference's two excluded check names. BrowserScan's word counter found 17 Normal and zero Abnormal occurrences, while the captured page includes a Robot result. A word-count-only result cannot establish a pass. Rebrowser's untriggered/unclassified entries are not passing coverage.

## Execution and provenance

The reviewed [reference examples](https://github.com/CloakHQ/CloakBrowser/tree/160f56da85860e89f0e7d9bfdc80266b984057d5/examples) came from a clean local examples checkout at revision `160f56da85860e89f0e7d9bfdc80266b984057d5`. All five canonical LF Git blobs match the previously reviewed identities in the [comparison plan](cloakbrowser-comparison-plan.md). The existing measurement runner retains its earlier review pin `fbf005bc199920b592df17ac4d489324e29d56d8`; the sanitized summary records both that review pin and the actual checkout revision instead of implying a new fetch of the earlier commit.

Executable SHA256: `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052`. Runtime DLL SHA256: `ed8619bbe2f4b087fa8e67628b16527393ce5498df596c27ac36fd9f19b5b04b`. Both were unchanged after testing. Python Playwright was **1.62.0**.

The [measurement runner](../benchmarks/reference_measurements.py) uses our SDK and local binary, loading only hash-guarded reference measurement functions and comparison definitions. It never executes reference binary download/launch code. Basic navigation and the demo backend collection use equivalent reviewed flows. Each case has a fresh isolated incognito context, 1920×1080 viewport, no proxy and no humanized input. Unsupported reference screen/timezone/GeoIP/noise arguments are omitted and remain unqualified. Host/native defaults apply.

The new [persistence runner](../benchmarks/reference_persistence.py) uses a separate fresh owned profile per mode. Each profile is launched twice, with explicit assertions for the initial empty state, cookie and localStorage values before closing and after reopening. The reference prints those values; our adaptation asserts them. Four independent persistent browser launches passed.

One full measurement run was executed per display mode, sequentially, followed by persistence. The reCAPTCHA collector waited for a successful verification response with the expected action and numeric score; no challenge solver or retry for a better score was used. The public demo observation does not establish production acceptance, repeatability, or support for other providers.

Raw JSON, logs, screenshots and page captures are retained locally under `artifacts/reference-examples/20261023-155-manual/`, excluded from Git. The sanitized summary records report/runner hashes. No native engine, ChromeDriver or browser property overrides were changed for these measurements.

## Other integration examples

This iteration runs the five requested top-level example workflows, not every integration demo in the reference repository. Remaining coverage is explicit:

| Reference integration | Status |
| --- | --- |
| Selenium | Our plain Selenium route already passes in both modes in the local driver matrix; the upstream CloakBrowser-specific import/download/argument entry point was not executed |
| browser-use | Not run: package absent from the test environment; example also needs an LLM account/key |
| Crawl4AI, Crawlee, LangChain, Scrapling | Not run: corresponding packages absent from the test environment |
| agent-browser shell example | Not run: CLI absent; upstream script uses Bash and CloakBrowser-specific launch configuration |
| AWS Lambda Dockerfile, instructions, entrypoint and handler | Not run: separate Linux container/cloud deployment workflow; no qualified Silly Browser Linux runtime |
| undetected-chromedriver | Not run: no driver-concealment patching performed; no compatibility pass claimed |

The actual CloakBrowser binary was not run as a paired control. These results therefore do not establish product parity, equal-version comparison, or all-example compatibility. No compiler was started, and the separate headed manual browser/profile was left open.

## Reproduce

With the Python SDK and Playwright installed, supply an explicit qualified executable and a checkout containing the exact reviewed example blobs:

```powershell
python benchmarks/reference_measurements.py --executable <chrome.exe> --reference-dir <examples-directory> --output <new-headed-results> --headed
python benchmarks/reference_measurements.py --executable <chrome.exe> --reference-dir <examples-directory> --output <new-headless-results>
python benchmarks/reference_persistence.py --executable <chrome.exe> --reference-dir <examples-directory> --output <new-persistence-results>
```

These are argument placeholders. Use new output directories; the persistence runner refuses to reuse one. A nonzero measurement-runner exit records failed/unqualified benchmark cases and does not mean native compilation failed.
