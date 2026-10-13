# silly-browser progress — 14 October 2026

An independent Chromium source project with JavaScript and Python automation SDKs. This is an experimental development snapshot; no custom browser binary or supported custom Chromium release is available yet.

## Completed foundation

- Pinned Chromium 146.0.7680.177 source checkout, full dependencies and successful native build generation on Windows.
- Two C++ source patches applied and checked against the exact upstream revision: seed lifecycle/engine identification and desktop platform web identity.
- Standalone C++ policy checks pass. Full Chromium compilation and browser-level patch validation are pending.
- JavaScript SDK: six tests passed. Python SDK: five tests passed. Coverage includes configuration, local browser behavior and concurrent persistent seed initialization.
- Persistent/temporary profiles, seed storage, documented SDK input pacing helpers, actionability checks and per-call configuration.
- Ten local driver smoke checks passed using **stock Chrome 155.0.8059.40** on Windows x64, in headed and headless modes: JS Playwright SDK, Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver. See [versioned summary](driver-baseline-summary.json).
- Benchmark collection tools and a public reference SDK review. The review inventories 103 files and examines selected sections of 17 files; it is not an audit of proprietary engine patches or a complete source audit.

## Current checkpoint

The first native Windows compilation is running with six workers. Its completion will be followed by custom-engine driver and identity checks. The build can still fail, and successful compilation alone will not establish fingerprint behavior or detector performance.

The two patches are the initial foundation. There are **zero browser-validated fingerprint patch families** at this checkpoint. Existing stock-browser results do not qualify the custom engine.

## Remaining work

Canvas/audio/font/graphics/display consistency, WebRTC privacy and routing, native authenticated HTTP/SOCKS5 transport, UDP/HTTP3 proxy support, network exposure policies, engine input changes, GeoIP behavior, extension validation, SDK coverage, additional platforms and release packaging remain outstanding. See the [completion tracker](engine-roadmap.md) for individual gates.

Chromium 146 is a historical integration anchor. Chromium 155 and 156 are planned rebase targets; neither is a validated custom release. A current supported engine is required before production distribution.

## Baseline findings

Stock Chrome runs returned Fingerprint Scan bot-risk scores of 100/100 in three repetitions. The three-run reCAPTCHA demo collection produced no verified scores within the collection window; a separate initial probe observed one verified 0.9. Sannysoft, Rebrowser and Device & Browser Info failed their current adapters. Other detector pages were captured without a validated pass verdict.

These observations describe the stock-browser harness only. No superiority over CloakBrowser, universal detector pass, 87-patch implementation or guaranteed CAPTCHA score is claimed. Raw captures, local profiles, machine reports and build logs are excluded from the public repository.
