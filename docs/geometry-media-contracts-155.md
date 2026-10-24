# Geometry and media-query contracts for Chromium 155

24 October 2026. P1 follows the completed [CDP lifecycle iteration](cdp-lifecycle-155.md). The starting candidate has eight patches; patch seven and every earlier runtime remain preserved. This investigation tests native correctness before proposing any new source change.

The fixture is [geometry-media-browser.test.mjs](../tests/geometry-media-browser.test.mjs). It serves an owned loopback document and same-origin frame, records real API values/events, and uses supported Playwright/CDP emulation commands. It changes neither system DPI settings nor browser API properties. Each scenario runs in a fresh context on both engines in both modes.

## Contracts and scope

| Scenario | Required behavior | Comparison boundary |
| --- | --- | --- |
| Configured resize at DPR 1 and 2 | Four viewport transitions and return update layout, visual viewport, CSS viewport units, width/orientation media queries and resize/change events; implicit screen follows Playwright's viewport reset | Exact configured values; event presence, without assuming event count/order |
| Native window resize | CDP normal-window bounds resize the viewport; layout/query relationships remain valid; restoring bounds restores the initial values | Allow 2 DIP window-bound tolerance; preserve native display/DPR; never require identical physical/headless screens or browser chrome insets |
| Device metrics and clear | Explicit 840×620 viewport, 1440×900 screen and DPR 1, 1.25, 2 propagate to document/frame/CSS queries; clear restores native baseline | Overrides remain explicitly configured; no implied physical display or OS change |
| Invalid device metrics | Negative width/height/DPR/screen width, out-of-screen position, zero scale and invalid orientation angle reject without corrupting accepted metrics; last valid state survives reload | Errors required, exact message text not required; inputs restricted to documented/native validation bounds |
| Visual viewport scale, scroll and reset | Page scale 2 changes the visual viewport while layout/DPR queries retain their values; page coordinates equal scroll plus visual offset; requested reset returns to initial scale on the next layout | Pinch/page scale is distinct from CSS page zoom; no synchronous reset guarantee asserted; do not require iframe visual scale to equal the top-level scale |
| Media preferences and reset | Explicit dark/light, reduced-motion and forced-color preferences update matchMedia, CSS and frame observations; change events occur across transitions; null clears emulation | Capture the baseline with null context preferences too: Playwright's implicit light preference differs from this PC's native dark preference |
| Target/context isolation | Commands addressing one target update that target, while sibling and unrelated-context geometry/preferences remain unchanged | Selected top-level CDP target behavior; this is not a general multi-client ownership guarantee |

Common checks bind CSS pixels, 100vw/100vh, viewport width/height queries, screen device-width/device-height queries, DPR resolution queries, CSS/query agreement and visual viewport coordinate relationships. Default rectangular unscrolled fixtures use no scrollbars; the scroll scenario accounts for the root's client area. Frame width/height use the full viewport to avoid making fractional iframe rounding an accidental contract. A frame has its own visual viewport scale contract.

The upstream control is the existing locally rebuilt 155.0.8059.80 source control, sharing the saved GN graph and unchanged artifacts. It is not an official distribution or a clean full build. Runtime EXE/DLL hashes are checked against the engine list before launching and rechecked after both modes. Paired comparisons include deterministic results/contract outcomes; OS-controlled native-window sizes and event counts are excluded from cross-engine equality.

## Source and specification references

- [CSSOM View](https://drafts.csswg.org/cssom-view/#extensions-to-the-window-interface) defines viewport geometry, DPR, media-query changes and visual viewport behavior. This is an evolving draft; the investigation records the local 155 implementation as well.
- [Playwright setViewportSize](https://playwright.dev/docs/api/class-page#page-set-viewport-size) documents viewport resizing and its screen reset. The installed JavaScript implementation is pinned to 1.62.1.
- The source-pinned protocol is `third_party/blink/public/devtools_protocol/domains/Emulation.pdl` and `Browser.pdl` at Chromium `43a195105613ac83c21d3f14de279f4a045c7da0`: `setDeviceMetricsOverride`, `clearDeviceMetricsOverride`, `setPageScaleFactor`, `resetPageScaleFactor`, `setEmulatedMedia`, `getWindowForTarget`, `getWindowBounds`, and `setWindowBounds`.
- Native ownership/validation paths: `content/browser/devtools/protocol/emulation_handler.cc`; renderer viewport behavior: `third_party/blink/renderer/core/frame/{visual_viewport,dom_visual_viewport}.cc` and Blink's emulation/geometry paths if a reproducer fails.

## Decision gate

Record all failing observations before changing an assertion or native source. Classify a fixture assumption, supported platform difference, upstream defect or custom regression separately. An upstream match does not excuse a contract violation. A confirmed C++ defect needs a minimal failing baseline, independently saved patch, separate candidate build, both-mode GREEN regression and affected compatibility checks. If these contracts pass, close P1 with expanded evidence and keep eight patches; no speculative CB-0009 or rebuild is required. Detector scores are a separate measurement and cannot substitute for these contracts.
