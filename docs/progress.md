# silly-browser progress — 14 October 2026

**Steps 1 and 2 are integration-validated.** The Windows x64 Chromium 146 custom binary compiled and passed its driver, identity and seed checks. It remains a historical development build; no production release or broad Chromium version range is supported.

## Measured results

| Check | Result | Scope |
|---|---|---|
| JavaScript custom-engine suite | 28 passed, zero failed | Native/preset identities, default/explicit versions, five JS surfaces, headed/headless modes, seed lifecycle/propagation and startup rejection |
| Python custom-engine suite | Five passed, zero failed | Sync/async launch options, native identity, persistent seed/storage, invalid options and temporary cleanup |
| Custom-browser driver smoke suite | Ten passed, zero failed | JS Playwright SDK/CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver, headed/headless |
| Exact two-patch source verification | Passed | Pinned Chromium 146 checkout and unchanged patch contents |

The [public validation summary](engine-validation-summary.json) records exact source, executable/runtime hashes, libraries, outcomes and limitations. The original six JavaScript and five Python SDK tests on stock Chrome remain earlier foundation evidence. Stock detector observations have not been relabeled as custom-browser results.

## Implemented foundation

- Two C++ patches: seed lifecycle/engine identification and desktop web identity settings.
- Profile storage and atomic persistent seed publication, plus temporary-profile cleanup.
- Documented SDK input pacing, actionability helpers and per-call settings.
- Basic custom-engine driver connections with the sandbox enabled.
- Reference SDK inventory of 103 files, with selected sections reviewed in 17. Proprietary engine patches were not reviewed or copied.

Only the desktop web identity family has the current narrow browser validation. Default and explicit values agree in tested document/frame/worker JavaScript surfaces; HTTP Client Hints are checked where the native fixture emits them. Native worker fetches omit those headers. Native preservation uses direct launches of the same custom binary as the control.

## Next iteration

[Step 3](implementation-plan.md#step-3): verify the current supported stable Chromium revision, rebase the validated patch series in a separate checkout, compile and requalify that exact binary. No stable rebase was started in iteration 2.

Rendering/audio/font/graphics/display work, native authenticated HTTP/SOCKS5 and UDP/HTTP3 transport, WebRTC/privacy policies, engine input changes, GeoIP, extension qualification, agent adapters, additional platforms and release distribution remain outstanding. See [completion tracker](engine-roadmap.md).

## Historical stock-browser detector observations

Stock Chrome 155 returned Fingerprint Scan bot-risk scores of 100/100 in three repetitions. The three-run reCAPTCHA demo collection produced no verified scores; a separate initial probe observed one verified 0.9. Sannysoft, Rebrowser and Device & Browser Info failed their current adapters. Other pages were captured without validated pass verdicts.

Those observations remain stock-browser harness evidence. This iteration made no custom detector pass, comparative superiority, 87-patch implementation or guaranteed CAPTCHA-score claim. Raw captures, profiles and machine/build reports remain excluded from the public repository.
