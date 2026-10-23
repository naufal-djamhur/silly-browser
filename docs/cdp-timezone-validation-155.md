# CDP timezone validation: patch seven

**Subsequent diagnostic follow-up:** [the patch-seven rerun](detector-results-155-patch7.md) now measures both external sites in both modes; all four criteria fail. The original native qualification checkpoint below remains preserved.

**24 October 2026 — Windows x64, Chromium 155.0.8059.80.** The independently tracked C++ fix is compiled and passes the strict regression in both headed and headless modes. Invalid timezone updates now return an error without replacing saved state, and the last valid override survives cross-site navigation. [Machine-readable evidence](cdp-timezone-validation-155-summary.json) binds the results to the candidate hashes.

## Native change

[CB-0007](../engine/releases/155.0.8059.80/patches/0007-cdp-timezone-validation.patch) implements the [reviewed proposal](native-cdp-review-155.md). The override handle and controller return validation success to the inspector agent. The agent returns `InvalidParams` before changing `timezone_id_override_` when ICU rejects an update. Canonical-equivalent no-ops remain successful. The engine handshake reports seven source patches; existing capabilities and `fingerprintIntegrationValidated=false` remain unchanged.

The patch also extends Blink's existing invalid-timezone protocol test with a valid-then-invalid request and a successful same-timezone request. That full Blink harness was not built or executed. Runtime qualification uses the owned [CDP contract probe](../benchmarks/cdp_emulation_probe.mjs) against the actual candidate, including cross-site navigation.

## RED to GREEN

| Runtime | Mode/configuration cases | Invalid updates incorrectly accepted | Last valid zone lost after navigation | Strict exit |
| --- | --- | --- | --- | --- |
| Preserved patch six | 4 | 4 | 4 | 1, expected RED |
| Separate patch seven | 4 | 0 | 0 | 0, GREEN |

Each runtime is tested headed and headless with ordinary defaults and with native `fr-FR` / `Europe/Paris`. The positive control navigates away and back with a valid override before submitting the invalid update. The candidate retains `Pacific/Honolulu`, including January/July offsets of +600 minutes, after rejection and subsequent cross-site navigation. Initial invalid input, same-zone updates, the equivalent `US/Hawaii` alias, a different valid update, reset/detach restoration, invalid locale handling, separate contexts and a real button interaction pass. All four candidate renderers remain usable without captured page errors or crashes.

## Regressions and compatibility

| Gate | Measured result |
| --- | --- |
| Node browser regressions, including upstream controls | **106 passed**, 0 failed, 0 skipped |
| Python custom-engine regressions | **5 passed** |
| Five driver routes × two display modes | **10 passed** |
| Shared stock comparison | 9 scenarios, **36 observations**, **27 equal-result comparisons** |
| Exact source series / pristine forward application | **7 patches verified** in each direction |

The Node group covers engine identity/seed behavior, profiles/context isolation, native locale/timezone and workers, Ahem and ten packaged Noto font faces, WebRTC/STUN policy, HTTP Basic proxy/CONNECT behavior and invalid startup controls, rendering/audio/layout/input/storage, and invalid API contracts. The stock control is the preserved locally rebuilt upstream-source **155.0.8059.80**, with the existing shared-artifact build limitations.

Driver routes are Playwright JS SDK, Playwright JS CDP, Puppeteer CDP, Python Playwright and Selenium. JavaScript versions are Node **24.22.1**, Playwright **1.62.1** and Puppeteer **25.13.0**. Selenium uses ChromeDriver **155.0.8059.84** with browser **155.0.8059.80**. The driver report confirms the seven-patch handshake.

The fixture's historical `patch-six` label was changed to `custom-candidate`; the corrected stock fixture was rerun successfully (**38 Node tests**, included coverage rather than 38 additional unique checks). The final CDP probe was also rerun against both runtimes. Original captures are retained separately.

## Build and preservation

The separate candidate is staged locally under `work/qualified/155-cdp-timezone-20261024/`. The exact upstream revision is `43a195105613ac83c21d3f14de279f4a045c7da0`. Six translation units were rebuilt with the existing GN compiler commands, two separate thin Blink archives were reconstructed, and a separate DLL was linked using unchanged remaining artifacts. `testing/internals.cc` is a test-only target outside the production graph and was not built. This is an incremental build, not a clean full rebuild.

Successful candidate build run: **137.031 seconds**; linking: **27.313 seconds**. An earlier preparation attempt stopped before compilation because a test-only object was not in the production graph; target discovery was corrected before this run.

| Artifact | SHA256 |
| --- | --- |
| chrome.exe | `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052` |
| chrome.dll | `4791896fcfe854ffd50d14cf88f51857967b8159995ba346f61b5a14183de526` |
| CB-0007 patch | `40f759d87920440028def3c7c154a586196c85d52fb1aaa0ef7f868d0ccc6f53` |

The five-patch output, qualified patch-six runtime, upstream control, historical reference, user profiles and unrelated legacy patch files are preserved. Original object/archive checks passed before staging; saved source/object/runtime hashes were checked again after testing. Private command logs and raw reports remain in the workspace; no binary or package release was published.

## Diagnostic references and limits

The requested [CreepJS project](https://github.com/abrahamjuliot/creepjs) documents API consistency and privacy observations across rendering, fonts, screen and timezone. [Fingerprint Scan's documentation](https://fingerprint-scan.com/docs) describes browser/network observations and explains that its score is an experimental playground result. These references can identify areas for independent compatibility tests; a detection heuristic alone is not proof of an engine defect.

This iteration fixes the reproduced invalid-input/state problem. It does not establish that either external site exercises this CDP sequence, and those sites were **not rerun on patch seven**. The [prior detector measurements](detector-comparison-155-146.md) remain historical patch-six evidence. No automation-signal concealment or score improvement is implemented or claimed. Linux/macOS, multiple concurrent CDP clients and complete worker emulation lifecycles remain unqualified. The zero CDP revision remains the existing nonofficial build setting.

## Repeat the owned gate

Supply an engine-list JSON with `id`, `executable`, `version`, `exeSha256`, `dllSha256` and **`nativeEnvironment: true`** for this candidate. Use a fresh output directory:

```sh
node benchmarks/cdp_emulation_probe.mjs --engines /path/to/candidate.json --output /path/to/fresh-report --expect-fixed
```

Keep the old runtime as the expected RED control. Do not rerun the old full pipeline into its preserved five-patch runtime directory to reproduce this candidate. A fresh complete build should apply the seven release-specific patches and use its own output directory, followed by these same runtime gates.
