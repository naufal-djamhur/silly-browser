# CDP lifecycle iteration: patch eight

**24 October 2026 — Windows x64 Chromium 155.0.8059.80.** The next native iteration is complete within its declared scope: owned lifecycle tests reproduced an inherited malformed-timezone defect, independent **CB-0008** fixes it in C++, and a separate compiled candidate passes the headed/headless gates. **Patch seven is preserved.** [Machine-readable evidence](cdp-lifecycle-155-summary.json) records hashes, individual checks, controls and limitations.

## Contracts and RED evidence

[The contract matrix](cdp-lifecycle-contracts-155.md) records the protocol/native ownership sources, assertions and observation-only cases. The [implemented fixture](../tests/cdp-timezone-lifecycle-browser.test.mjs) runs nine scenarios: the planned eight plus an initial-malformed-identifier control needed to distinguish acquisition from updates.

| Preserved baseline | Observations | Passed | Failed |
| --- | --- | --- | --- |
| Patch seven: two configurations × two modes × nine scenarios | 36 | 28 | 8 |
| Upstream-source 155: native configuration × two modes × nine scenarios | 18 | 8 | 10 |

The patch-seven failures are the interleaved malformed-update and initial-malformed-ID scenarios in all four configuration/mode cases. The upstream control shares those failures and also retains the known invalid-update state bug fixed by CB-0007. These are intentional **RED contract results**, not missing data or collection successes being counted as passes. All 54 baseline observations completed with no captured page errors or crashes.

## Confirmed defect and native fix

A valid identifier such as `Pacific/Honolulu` followed by **U+0000** and `Invalid` is a different, malformed identifier. Before CB-0008, the ICU conversion treats the string as NUL-terminated and accepts the valid prefix. A malformed identifier can therefore be accepted on initial acquisition or while updating an existing override; a different valid prefix can also change the effective timezone.

[CB-0008](../engine/releases/155.0.8059.80/patches/0008-timezone-embedded-nul-validation.patch) rejects embedded NULs in `TimeZoneController::SetTimeZoneOverride` and `ChangeTimeZoneOverride`, before canonical comparison or conversion. Existing CB-0007 response/state handling then returns the invalid-parameter error without saving the rejected identifier. Ordinary supported identifiers, canonical aliases and empty-string clearing retain their behavior. No SDK/JavaScript property override or ChromeDriver binary change implements this fix.

The Blink invalid-timezone protocol test source now includes malformed initial and update requests. Its full Blink/content_shell harness remains **unrun**; actual-browser owned CDP tests provide the measured runtime qualification.

## GREEN lifecycle results

The separate eight-patch candidate passes **36/36 scenario observations**: nine scenarios × default/native environment × headed/headless. Node reports **37 passing tests** because it also counts the outer test wrapper.

| Scenario | Candidate mode/configuration cases passed |
| --- | --- |
| `close-target-and-create-target` | 4/4 |
| `detach-after-rejected-update` | 4/4 |
| `initial-malformed-timezone-identifiers` | 4/4 |
| `interleaved-invalid-updates` | 4/4 |
| `multiple-client-ownership` | 4/4 |
| `persistent-profile-relaunch` | 4/4 |
| `rejected-update-cross-site-and-return` | 4/4 |
| `rejected-update-reload-and-document-replacement` | 4/4 |
| `worker-creation-and-restoration` | 4/4 |

All captured malformed requests now fail with `Invalid timezone id`. Native baselines and the last accepted values remain correct. Navigation/reload/replacement, detach/target cleanup, owned persistent storage/relaunch and worker baseline/restoration pass. Matching-request multi-client ownership after the first owner detaches remains observational; the fixture does not invent independent ownership guarantees. Worker during-override samples are similarly observational, with native baseline/restoration asserted.

## Regression and driver gates

- **Four** previous strict CDP timezone cases pass.
- **106** existing Node browser tests pass, with zero failures/skips. These include upstream controls, native configuration/worker behavior, profiles, fonts, WebRTC/STUN, proxy authentication, rendering/audio/input/storage and API errors.
- **Five** Python checks pass.
- **Ten** driver routes pass: Playwright JS SDK/CDP, Puppeteer CDP, Python Playwright and Selenium, each headed and headless.
- The existing shared functional comparison passes **36 observations and 27 comparisons** against the preserved upstream-source control; these are included regression coverage, not additional unique Node tests.

JavaScript uses Node **24.22.1**, Playwright **1.62.1** and Puppeteer **25.13.0**. Selenium uses ChromeDriver **155.0.8059.84** with browser **155.0.8059.80**. The candidate handshake reports **eight** source patches and retains the existing bounded capabilities and `fingerprintIntegrationValidated=false` marker.

The first broad run had **101 Node passes and five failures**, including the outer proxy test wrapper: four subtests received unhandled `ECONNRESET` errors from the local fixture. Its ten functional authentication observations all passed. A preserved patch-seven proxy control passed twelve Node tests. The fixture now handles and records reset errors on CONNECT client sockets, including early rejected/background tunnels, while retaining failures for other errors and all authentication assertions. The complete regression group was rerun after this test-only correction. The initial TCP stack did not attribute each reset to a connection, and no per-connection cause is claimed. Original logs/reports remain under `initial-browser-regression/`; the native candidate was not rebuilt for the fixture change.

## Build, provenance and preservation

The candidate is staged at `work/qualified/155-cdp-lifecycle-20261024/`. Six production translation units were rebuilt using the existing verified GN commands, two separate thin Blink archives were reconstructed, and a separate DLL was linked with unchanged remaining artifacts. This is an incremental Windows x64 build, not a clean full build or official distribution.

Successful build run: **150.833 seconds**, including **29.182 seconds** linking. Exact reverse verification and pristine forward application pass for all eight release-specific patches. Saved source/object/runtime inputs and the patch-seven EXE/DLL were checked unchanged after the tests. Original five/six/seven-patch runtimes, stock control, reference, user profiles and unrelated legacy files are preserved.

| Artifact | SHA256 |
| --- | --- |
| Candidate chrome.exe | `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052` |
| Candidate chrome.dll | `afd67b2deb35a39080830b801451148d5c2eadffe64225f1902f41177daaff3e` |
| CB-0008 patch | `f21a19e634b3968bd9caa6a2686458571a0279240fa82e82c096c611b10c5fc1` |
| Preserved patch-seven chrome.dll | `4791896fcfe854ffd50d14cf88f51857967b8159995ba346f61b5a14183de526` |

## Boundaries and next work

This completes N8-1 through N8-4 for the reproduced defect. Linux/macOS, real OS-timezone changes, exhaustive client/worker races and the full Blink harness remain unqualified. There is **no external CreepJS/Fingerprint Scan rerun or score-improvement claim** in this iteration. The prior [patch-seven diagnostic failures](detector-results-155-patch7.md) remain their own evidence; this native correctness fix does not turn them into passes.

The next planned family is native geometry/media-query coverage from [the follow-up queue](next-native-iteration-155.md), subject to a separate ready iteration. No compiler is active at this completion checkpoint. No native binary/npm/PyPI release was published.
