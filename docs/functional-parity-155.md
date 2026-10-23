# Native inspection and functional parity — 23 October 2026

Selected Chromium C++ startup, timezone and Windows font paths were inspected, followed by local headed/headless tests on the exact five-patch **155.0.8059.80 Windows x64** runtime. **No native defect was reproduced in the tested scenarios, so no speculative C++ or ChromeDriver patch was added.**

The new [functional fixture](../tests/functional-parity-browser.test.mjs) passes **18 Node tests**, including 16 scenario observations and their paired comparison. All eight application observations agree between modes. The existing configuration/native environment tests also pass again, as do all ten driver routes. The [sanitized summary](functional-parity-155-summary.json) records the actual evidence digests, selected source identities and unchanged executable/DLL hashes.

## Source inspection

| Selected C++ path | Finding and evidence limit |
| --- | --- |
| `chrome/browser/headless/headless_mode_init.cc`, `headless_mode_util.cc` | Headless startup has explicit unattended/profile lifecycle choices. The automatic software-GL selection in this file is Linux-only; it is not a Windows GPU regression. No change needed for the tested Windows application outcomes. |
| `chrome/browser/headless/chrome_browser_main_extra_parts_headless.cc` | Headless installs a platform-independent clipboard. A separate OS clipboard implementation is intentional; this run does not exercise or replace the user's clipboard. |
| `chrome/app/chrome_main_delegate.cc`, `chrome/common/custom_browser_locale_policy.h` | The custom locale/timezone setup and validation run through shared startup paths. The existing locale restoration after resource initialization applies without a headed/headless branch. Current runtime configuration checks pass. |
| `services/device/time_zone_monitor/time_zone_monitor.cc`, `third_party/blink/renderer/core/timezone/timezone_controller.cc` | Explicit native timezone handling and restoration around an existing context override were inspected. Paired default/DST and context-isolation tests pass. Actual host timezone notifications were not simulated. |
| `ui/gfx/win/custom_browser_font_directory.h`, `custom_browser_font_files.h` | Configured directory discovery/validation is browser-process scoped. This run supplies a dedicated local Ahem directory; it does not claim every font/directory failure condition is covered. |
| `ui/gfx/win/direct_write.cc`, `content/browser/renderer_host/dwrite_font_proxy_impl_win.cc` | Both local font collection paths combine configured and system fonts. Native Ahem metrics pass through the browser/rendering path in both modes. Full fallback and enumeration are separate coverage. |

These are selected paths in the checkout at upstream commit `43a195105613ac83c21d3f14de279f4a045c7da0`, with the existing five custom patches applied. The summary preserves their file hashes. This is not a complete Chromium source audit. The previous [48-check qualification](engine-validation-155.md) remains separately recorded.

## Paired application checks

All cases run against a loopback HTTP fixture using the same machine, native locale `fr-FR`, timezone `Europe/Paris`, 960×720 application viewport and device scale 1. Each scenario receives a fresh isolated context. Normal deterministic driver input is used; there is no humanized input, proxy, external detector, identity-property injection or CAPTCHA workflow.

| Scenario | Headed | Headless | Required application outcome |
| --- | --- | --- | --- |
| Layout and native font | Pass | Pass | Exact CSS box geometry, viewport size and Ahem 80px advance |
| Canvas and offscreen worker | Pass | Pass | A known flat RGB fill reads back correctly in document and worker |
| WebGL rendering | Pass | Pass | Clear/readPixels color is within one byte of the expected value, with no GL error |
| Offline audio | Pass | Pass | All 128 gain-processed samples match within `1e-7` |
| Unicode editing and Tab order | Pass | Pass | Whole emoji deletion, Japanese replacement, disabled-control tab skip and exactly one activation |
| Nested scrolling and iframe input | Pass | Pass | Target reached in its own scroller, outer page stays still, frame value saved |
| Popup navigation and close | Pass | Pass | Intended popup loads/closes and its opener remains usable |
| IndexedDB and native worker configuration | Pass | Pass | Data survives database reopen; document/worker configuration and HTTP language agree |

The paired comparison checks the resulting application observations, not elapsed-time equality, hardware identity or native window-frame dimensions. These eight successful comparisons do not establish universal rendering or driver parity.

## Existing gates rerun

Three existing Node tests pass without skips: context locale/timezone/DST/viewport isolation; native CLI rejection of invalid locale/timezone; and native document/frame/HTTP/dedicated/shared/service-worker configuration with Ahem loading in both modes.

All ten driver smoke routes pass again: JavaScript Playwright SDK, JavaScript Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver, each in headed and headless mode. This matrix establishes those smoke workflows, not every operation of each driver. It records the executable hash; the complete native functional report checks both executable/DLL hashes before and after the sequence, with a final matching hash check when generating the summary.

Raw evidence is retained privately under `artifacts/functional-parity/20261023-155/`. The compiler was not started, the patch count stays five, and the separate manual browser/profile was preserved. External [detector benchmark failures](reference-tests-155.md) remain recorded; passing these application checks does not change those observations.

## Run the functional fixture

Install the repository's npm dependencies and use its supported Node version. Set `CUSTOM_BROWSER_EXECUTABLE` to the qualified `chrome.exe`, `CUSTOM_BROWSER_RELEASE` to its exact version, and `CUSTOM_BROWSER_FONT_TEST_DIR` to a dedicated directory containing the licensed Chromium test fixture `third_party/blink/web_tests/resources/Ahem.ttf`. Optionally set `CUSTOM_FUNCTIONAL_PARITY_REPORT` to a new JSON evidence path, then run:

```powershell
npm run test:functional-parity
```

The test requires the native font-directory capability and refuses an incomplete configured run. Without an explicit executable it skips, allowing browser-free SDK CI to remain distinct from native runtime qualification. This run covers one paired execution per scenario; contention, cancellation, real-time audio devices, host-change notifications, clipboard integration, broader fonts and other operating systems remain unqualified.
