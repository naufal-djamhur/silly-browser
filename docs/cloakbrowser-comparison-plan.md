# Post-build CloakBrowser comparison — 22 October 2026

Status: queued after actual Chromium 155 build qualification. The active Windows x64 build must be preserved. This document adds no native patches and reports no new browser measurements.

## Source checkpoint

The requested five examples were reviewed at CloakBrowser revision [`3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969`](https://github.com/CloakHQ/CloakBrowser/tree/3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969/examples). Their Git blob identities are:

| Example | Git blob |
| --- | --- |
| basic.py | `951d581ebd2606a60b0510ebae52fddd491f6f17` |
| persistent_context.py | `e8978d1b2a8ebc79b9ab9038adb96a877d05e553` |
| fingerprint_scan_test.py | `472dc99b9faa3cb8f4f006f56b45ee83d75573d8` |
| recaptcha_score.py | `50202e13a80c22c981c77a5f1bbba1a59f53957b` |
| stealth_test.py | `bf9d26ed631c4b71e3131d2a00945c7f268f776c` |

The four previously measured example blobs are unchanged from the earlier reviewed pin. Keep that runner's existing source guards. The additional persistent example opens the same profile twice, writes a cookie/localStorage value and prints them after reopening; strengthen our adaptation with explicit assertions. Its original entry point is headed only. Basic is also headed only, reCAPTCHA is headless only, and the other two expose mode switches. Our comparison must explicitly run both modes rather than treating upstream defaults as two-mode coverage.

## Ordered iterations

1. **Qualify the completed 155 binary.** Follow [post-build validation](post-build-validation.md). Bind results to executable/DLL hashes, source pin, three-patch manifest, driver versions and actual capabilities. Run the configured engine, Python, local WebRTC and driver gates. Repair the first actual failing gate before moving on. Do not substitute the historical 146 runtime.
2. **Navigation and profile contracts.** Run equivalent basic navigation and cookie/localStorage restart workflows in both modes. Use isolated owned profiles and explicit assertions, with a local deterministic fixture alongside the public example. Verify session state and seed persistence across two independent launches; test profile isolation and cleanup. Existing persistence checks are useful coverage, but do not qualify every mode on the new binary until executed. Use SDK or fixture fixes when the engine already provides the correct behavior.
3. **Bounded external measurements.** Rerun the hash-guarded reference measurements on the actual 155 binary in both modes, in new evidence folders. Preserve screenshots, backend responses, service availability and unsupported-option status. Missing/untriggered results are not passes. Report each detector separately; a reCAPTCHA demo observation does not qualify production traffic or establish a guaranteed score.
4. **Comparable product baseline.** Identify the exact lawfully available CloakBrowser binary version, platform, build identity and capabilities before runtime comparison. Pair the same machine, network/proxy policy, locale, viewport, driver, fixture and profile state. Separate cold profiles from persistent profiles. Free historical 146 versus our 155 is a version-confounded reference, not an equal-version control. A current free tier is not evidence that the native patch source is public.
5. **One implementation change per reproducible defect.** Convert observed correctness, interoperability, rendering or documented privacy-policy failures into local regressions. Choose SDK, configuration or native C++ changes based on the cause. Rebuild incrementally and retest the affected regression in both modes plus relevant compatibility gates. Keep sandboxing enabled. Publish measured scope, not patch-count or detector-parity claims. The broader [interaction plan](headless-headed-e2e-plan.md) remains applicable.

## Reverse-engineering evidence boundary

The public repository and its [README](https://github.com/CloakHQ/CloakBrowser/blob/3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969/README.md) describe a Python/JS wrapper around a modified binary. The advertised native patch list is not recovered source. The repository's MIT license applies to wrapper code; its [binary license](https://github.com/CloakHQ/CloakBrowser/blob/3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969/BINARY-LICENSE.md) is separate. Preserve attribution for any reused wrapper code and keep our native implementation independent and reviewable.

The explicitly requested reverse-engineer-anything skill was read. No REA native tools are connected in this session. Read-only doctor diagnostics using existing Node 24.19.0 report stale Codex registration and no available Ghidra/IDA/Kuna native analysis engine. No configuration or engine installation was performed, no CloakBrowser binary was decompiled, and no native REA Evidence record exists. Source inspection used normal repository tools, as the skill specifies. Exact native patch recovery remains unresolved; it must not be inferred from wrapper flags, marketing or example outcomes.

Before native analysis, select and hash the actual comparator artifact, inspect available analysis state, and use the skill's supported recovery process for the specific missing capability. Do not modify licensing or session controls. Do not claim that decompilation reconstructs original C++ source or proves all 87 patches. Continue source and behavioral comparison independently when native analysis is unavailable.

## Current finding ledger

| Question | Evidence and conclusion | Status |
| --- | --- | --- |
| Which examples and mode defaults? | Exact source blobs above, source read only | Answered |
| Do basic/persistence require native patches? | They exercise ordinary navigation/profile APIs; new 155 behavior awaits execution | Partially answered |
| Does 155 pass the five examples in both modes? | No completed 155 runtime yet | Unresolved |
| How did historical 146 perform? | [Earlier measured report](reference-tests-prestable.md): basic passes; detector/CreepJS failures and unavailable variants remain | Answered for that historical runtime only |
| What are CloakBrowser's exact native changes? | Public wrapper is insufficient; no native analysis performed | Unresolved |
| Is product parity established? | No paired exact-artifact comparison and no completed 155 validation | Unresolved |

The build runner already schedules local validation after linking. This comparison document does not schedule a background implementation agent or automatically run external services. Resume from the next ready iteration using live state and saved evidence.
