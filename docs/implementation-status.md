# Implementation status — 14 October 2026, Asia/Jakarta

**Outcome: the first Windows custom Chromium integration binary and its local validation are complete. The requested full browser remains in development.**

**Update, 14 October 2026:** the Windows x64 Chromium 146 integration build completed. Twenty-eight JavaScript engine checks, five Python custom-engine checks and ten custom-engine driver smoke checks pass. Exact source and executable/runtime hashes, scope and limitations are recorded in [validation summary](engine-validation-summary.json). Earlier SDK and stock-browser outcomes remain foundation evidence. Steps 1 and 2 are complete; the next iteration is the supported-stable rebase in step 3. Original detector baseline measurements below are unchanged.

## Built and verified

- Git repository with pinned Chromium revision, build settings, checkout instructions, preflight checks, patch application tooling, and a patch manifest.
- Two source patches for seed startup, child switch propagation, an engine handshake, and desktop web identity presets. Both apply cleanly to exact upstream source and compiled successfully. Windows identity and seed behavior have actual browser evidence.
- C++17 seed parser compiled using the installed Visual Studio compiler; boundary and invalid-input tests pass.
- JavaScript SDK and six tests, including real-browser local input/profile behavior and concurrent seed creation, pass.
- Python sync/async SDK and five real-browser/configuration/concurrency tests pass.
- Profiles preserve explicit persistent cookies, localStorage, and the seed. Temporary profiles clean up on SDK close.
- Optional SDK mouse curves, paced typing and scrolling; click helpers use actionability and revalidation. Per-call configuration is supported on the documented methods.
- Eight detector/evidence targets, three repetitions each, plus initial priority-site probes. Reports include raw evidence and explicit unavailable/captured statuses.
- Reference inventory of 17 files at CloakBrowser commit `214a2beb69150aed39484f2730e3ed88dd8f699a`.

## Measured baseline results

These runs use **stock Google Chrome 155.0.8059.40**, Playwright 1.62.1, Windows, headless mode, native defaults, a fresh temporary profile per test, no proxy, and no humanization. They are not results for a custom Chromium binary. Thresholds are provisional project targets.

| Target | Three-run suite | Additional initial observation |
|---|---|---|
| Fingerprint Scan | Bot-risk score 100/100 in all three; target not met | 100/100 |
| reCAPTCHA v3 demo | No verified backend score in all three within the 30-second collection window | One server-verified 0.9, action `examples/v3scores` |
| Sannysoft | Failed in all three | Not run separately |
| Rebrowser | Failed in all three | Not run separately |
| Device & Browser Info | Failed in all three | Not run separately |
| Incolumitas | Raw evidence captured; no validated verdict adapter | No pass claimed |
| BrowserScan | Raw evidence captured; no validated verdict adapter | No pass claimed |
| CreepJS | Raw evidence captured; no validated verdict adapter | No pass claimed |

Raw local reports and captures are excluded from the public repository. This table records the observed outcomes; driver outcomes and versions are retained in [baseline summary](driver-baseline-summary.json).

The demo warns that its score does not represent production traffic. The initial 0.9 result is a baseline observation, not proof of stealth or reliable target attainment. The repeated unavailable results are retained separately from numeric scores. [reCAPTCHA demo](https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php)

## Initial native build blocker (resolved)

Installed Visual Studio 2022 is 17.12.35728.132, with C++ and MFC/ATL present. Memory is 31.6 GiB and free disk was approximately 275 GiB at the last audit.

The pinned Chromium revision requires Windows SDK 10.0.26100.4654. The SDK and debugger DLL now both report 10.0.26100.4654 and satisfy the prerequisite checks. [Pinned Windows build instructions](https://chromium.googlesource.com/chromium/src/+/refs/tags/146.0.7680.177/docs/windows_build_instructions.md)

The required SDK and debugger update is installed and verified.

The full Chromium checkout and dependency sync completed using a short workspace drive mapping. Both applied patches were verified again in iteration 2. Build generation and native compilation completed; custom-engine driver and expanded identity/seed checks passed. The build remains a historical integration artifact rather than a production release.

## Work still required

The desktop web identity family and seed infrastructure are locally validated on the Windows x64 compiled integration binary. Canvas, audio, fonts, WebGL/WebGPU, graphics/display consistency, WebRTC policies, network timing/header policies, authenticated SOCKS5, UDP/HTTP3 proxy transport and CDP input changes remain outstanding. There are two source patches; no 87-patch count or broad fingerprint capability is claimed.

SDK HTTP credential handling currently uses Playwright, not custom network-layer support. GeoIP deliberately fails as not implemented. Platform presets require the custom engine handshake and Windows integration validation passed. Extension loading options are provided for profile contexts but custom-engine extension behavior has not been tested. Humanization covers documented SDK operations, not every raw CDP/driver call; explicit cancellation handles remain pending.

Native browser builds on Linux/macOS, custom UI, AI/MCP adapters, release signing/downloads, expanded Selenium and undetected-chromedriver integration execution, and comparisons against CloakBrowser/Camoufox/Patchright remain pending. Basic Selenium/ChromeDriver custom-engine smoke checks passed. All reference example files are inventoried; their external integration suites have not been run or claimed passing.

Next: verify and rebase onto the current supported stable engine in a separate checkout, qualify that binary, collect native diagnostics and implement one family at a time according to the [implementation plan](implementation-plan.md). Repeated benchmark comparisons and production release gates remain later work.
