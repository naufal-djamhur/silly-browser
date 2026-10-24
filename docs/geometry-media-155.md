# Native geometry and media-query iteration: patch nine

**24 October 2026 — Chromium 155.0.8059.80, Windows x64.** Independent **CB-0009** fixes a reproduced DPR-only resolution-query invalidation defect in Blink. The separate compiled candidate passes all **16 geometry/media-query observations** in headed and headless modes, plus the existing native/regression/driver gates. Patches seven and eight remain preserved. [Machine-readable evidence](geometry-media-155-summary.json) binds the observations, source and binaries.

## Reproducer and native cause

The [owned contract matrix](geometry-media-contracts-155.md) and [fixture](../tests/geometry-media-browser.test.mjs) extend earlier fixed-screen/layout controls with resizing, query events, DPR transitions, visual viewport scaling, explicit preferences, invalid-command preservation and target isolation.

On both patch eight and the upstream-source 155 control, keeping the viewport at **840×620** and screen at **1440×900**, then changing only DPR **1.25 → 2**, produces the following result in both display modes and the same-origin frame:

| Observation | Before CB-0009 | Candidate |
| --- | --- | --- |
| `devicePixelRatio` | 2 | 2 |
| JavaScript `(min-resolution: 1.5dppx)` | true | true |
| CSS rule for that resolution | stale, false | updated, true |
| `MediaQueryList` change event | missing | delivered |

The final baseline has **32 observations: 28 passes and four intentional failures**. Node counts 34 tests and six failures because the comparison and outer wrapper also fail. Independent minimal controls reproduce stale CSS and missing events after two rendering frames; this is more than a collection timeout. All four baseline failures retain the effective DPR/JS/CSS/event samples before cleanup. The separate upstream control shares the existing GN graph and unchanged artifacts; it is not an official distribution or a clean full build.

`WebFrameWidgetImpl::SetScreenInfoAndSize` updates emulated screen data. Device emulation retains the compositor's real host scale; a DPR-only change can leave layout zoom and dimensions unchanged, so ordinary resize/zoom invalidation does not refresh resolution CSS or notify query listeners. [CB-0009](../engine/releases/155.0.8059.80/patches/0009-device-metrics-resolution-invalidation.patch) compares effective DPR before/after the screen update and calls the existing local-subtree media-query invalidation path only when it changes. It changes no JavaScript API property or ChromeDriver binary.

A new Blink inspector-protocol regression covers resolution CSS and event transitions at constant dimensions. Its full Blink/content_shell harness is **unrun**; runtime qualification comes from the actual-browser owned fixtures.

## Candidate results

| Gate | Measured outcome |
| --- | --- |
| Eight geometry scenarios × two display modes | **16/16 pass**, 17 Node tests including wrapper |
| Unaffected geometry signatures against upstream | **14/14 match**; exclude the intentionally failing DPR scenario |
| Existing CDP lifecycle observations | **36/36 pass** |
| Previous strict timezone cases | **4/4 pass** |
| Existing Node browser regression group | **106 pass**, zero fail/skip |
| Python custom-engine checks | **5 pass** |
| Driver routes | **10 pass**, including Playwright, Puppeteer, Python and Selenium in both modes |

The geometry fixture covers configured resizing at DPR 1 and 2; native window resizing/restoration; repeated DPR up/down transitions and clearing; seven rejected metrics inputs with last-valid-state preservation/reload; visual viewport scale/scroll/reset; explicit media-preference changes/reset; and sibling/unrelated-context isolation. Native window bounds have a 2 DIP tolerance, visual geometry allows the declared rounding tolerance, and event presence is asserted without inventing counts/order. Native headed and headless screens are allowed to differ.

The broad regression group includes **36 shared functional observations and 27 comparisons** against upstream. These are included coverage, not additional unique Node tests. JavaScript uses Node 24.22.1, Playwright 1.62.1 and Puppeteer 25.13.0; Selenium uses ChromeDriver 155.0.8059.84 with browser 155.0.8059.80. The candidate reports nine source patches and retains `fingerprintIntegrationValidated=false`.

## Corrected fixture assumptions

The first run passed 20 of 32 observations and failed 12. Eight failures came from two assumptions: null Playwright media preferences clear emulation and expose this PC's native **dark** preference, rather than restoring Playwright's implicit light default; and the protocol scale-reset request is consumed by a subsequent layout. The fixture now captures a null-preference baseline and supplies an owned layout transition for the reset request. No native change was made for those observations, and no synchronous-reset guarantee is claimed. The remaining four failures were the DPR defect; their assertions remain strict. Initial and corrected captures are preserved separately.

## Build and preservation

The separate candidate is `work/qualified/155-geometry-media-20261024/`. Two translation units were rebuilt using their exact GN commands; five verified patch-eight objects were reused, two separate thin Blink archives were reconstructed and a new DLL was linked against unchanged remaining artifacts. Build time was **128.185 seconds**, including **29.52 seconds** linking. This is an incremental build, not a clean full build.

| Artifact | SHA256 |
| --- | --- |
| Candidate chrome.exe | `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052` |
| Candidate chrome.dll | `21e04f73104e3f44070953950444e36148bdf717b79ab1052442ef4f462abff1` |
| CB-0009 patch | `6dafe7a8aad4d87177cfc60453f4c9ef0021b631bcb7acc0ee2cbf90fb68f71f` |
| Preserved patch-eight chrome.dll | `afd67b2deb35a39080830b801451148d5c2eadffe64225f1902f41177daaff3e` |
| Preserved patch-seven chrome.dll | `4791896fcfe854ffd50d14cf88f51857967b8159995ba346f61b5a14183de526` |

Exact reverse verification and pristine forward application pass for all nine release-specific patches. Saved original build/source/runtime inputs and baseline hashes remain unchanged after testing. Original five/six/seven/eight-patch runtimes, upstream/reference controls, manual profiles and unrelated legacy files are preserved. Raw evidence is under `artifacts/geometry-media/20261024-final-baseline/` and `20261024-candidate9/`; private build/test receipts are under `work/geometry-media-20261024/`.

## Boundaries and continuation

This closes P1 for the scoped contracts. Cross-process frames, real OS DPI changes, multi-monitor movement, Linux/macOS and exhaustive rendering/geometry cases remain unqualified. The scale-reset observation is bounded as described above. No compiler or test pipeline remains active.

**At the P1 completion checkpoint, CreepJS/Fingerprint Scan had not been rerun on patch eight or nine.** The latest [patch-seven measurements](detector-results-155-patch7.md) still fail: Fingerprint Scan bot-risk **100/100 in both modes**, CreepJS headless **33% headed / 100% headless**, with stealth **0% / 0%**. This native correctness fix does not establish a detector pass or score improvement.

The next planned family is **P2: licensed font fallback and text rendering**, requiring its own scoped contract/reproducer before any further native patch. No native binary/npm/PyPI release is qualified or published.

**Subsequent follow-up:** [fresh patch-nine measurements](detector-results-155-patch9.md) now exist and still fail both sites in both modes. They are a separate diagnostic run; the native correctness results above remain unchanged.
