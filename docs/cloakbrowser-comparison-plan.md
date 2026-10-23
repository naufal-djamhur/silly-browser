# Post-build CloakBrowser comparison — updated 24 October 2026

Status: the exact five-patch Windows 155 build passes [48 local integration checks](engine-validation-155.md). The five requested [reference example workflows have now been measured in both modes](reference-tests-155.md): navigation/persistence pass, the demo score is 0.9 per mode, and the overall detector benchmark fails. Preserve the completed runtime and separate manual session. This comparison iteration adds no native patches.

**Latest continuation:** the [patch-six rerun](reference-tests-155-patch6.md) records unchanged headline results in both modes and exact failing check names. Local functional and API-contract controls establish no native defect in the tested scope. An own collector repair recovers missing rendered detail flags; native source, driver binaries and patch count remain unchanged. The [sanitized summary](reference-tests-155-patch6-summary.json) preserves runtime, source and report identities. The five-patch status above is the historical comparison point.

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

1. **Qualify the completed 155 binary — complete for the measured Windows scope.** [48 local checks](engine-validation-155.md) bind results to executable/DLL hashes, the source pin, five-patch manifest, driver versions and actual capabilities. Keep this evidence distinct from the historical 146 runtime.
2. **Navigation and profile contracts — measured.** Equivalent basic navigation and two-launch cookie/localStorage restart workflows pass in both modes with fresh owned profiles and explicit assertions. The local integration gates separately cover seed/storage, lifecycle and context isolation on this binary. Broader profile contention and interaction cases remain separate MVP work. Use SDK or fixture fixes when the engine already provides correct behavior.
3. **Bounded external measurements — executed once per mode.** The [hash-bound report](reference-tests-155.md) preserves current 155 observations and documents missing/untriggered coverage and unsupported options. Fingerprint Scan/CreepJS and the qualified detector comparisons fail. A verified 0.9 reCAPTCHA demo score per mode does not qualify production traffic or establish repeatability. Keep raw screenshots/backend evidence private and report each detector separately.
4. **Comparable product baseline.** Identify the exact lawfully available CloakBrowser binary version, platform, build identity and capabilities before runtime comparison. Pair the same machine, network/proxy policy, locale, viewport, driver, fixture and profile state. Separate cold profiles from persistent profiles. Free historical 146 versus our 155 is a version-confounded reference, not an equal-version control. A current free tier is not evidence that the native patch source is public.
5. **One implementation change per reproducible defect.** Convert observed correctness, interoperability, rendering or documented privacy-policy failures into local regressions. Choose SDK, configuration or native C++ changes based on the cause. Rebuild incrementally and retest the affected regression in both modes plus relevant compatibility gates. Keep sandboxing enabled. Publish measured scope, not patch-count or detector-parity claims. The broader [interaction plan](headless-headed-e2e-plan.md) remains applicable.

## Reverse-engineering evidence boundary

The public repository and its [README](https://github.com/CloakHQ/CloakBrowser/blob/3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969/README.md) describe a Python/JS wrapper around a modified binary. The advertised native patch list is not recovered source. The repository's MIT license applies to wrapper code; its [binary license](https://github.com/CloakHQ/CloakBrowser/blob/3da25f5978fd4b0ab7ebdc88d1ccb1e40d0f8969/BINARY-LICENSE.md) is separate. Preserve attribution for any reused wrapper code and keep our native implementation independent and reviewable.

The explicitly requested reverse-engineer-anything skill was read. The first diagnostic ran through a different cached launcher and reported registration drift. Rechecking the installed REA 6.7.0 launcher with its Node 24.22.1 runtime established that its Codex registration was aligned; the missing native analysis engine was the actual readiness gap.

On the user's explicit setup request, Ghidra 12.1.4 was installed from its official release archive after verifying SHA256 `ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`. The existing full JDK 22.0.1 passed admission. Only REA's Ghidra/Java/provider environment entries changed in the backed-up Codex configuration; unrelated settings and skill files were preserved. Scoped doctor checks pass, including Windows Job Object/DACL/NTFS controls. A fresh stdio MCP connection passed initialization, tool discovery (207 tools) and `binary_session`. Reconnection was outstanding at that setup checkpoint; the REA tools subsequently connected directly, as recorded below.

The free `chromium-v146.0.7680.177.5` Windows archive was acquired from its official release and verified against SHA256 `b213795cb32c3169f766c74ce1d0275fc89d3df256de39c04da7fb4c23b7fdbe`. Selected `chrome.exe` SHA256 is `03f53661a5c47e7b0a661bee2bce8a0d302b7a60834c328df417561fa0636d80`; `chrome.dll` is `ed7009a70d76fa4da222a5b37c34012d77fcc04092ef8df5fb572062940fa4dd`. The binaries were not executed or redistributed. A static PE resource inventory succeeded with REA Evidence `ev_a5560dc1174a4722a483ef255a8689dc3b4277bf9b5bf7273bac63641dd71173`; it establishes resource identities/ranges, not native patch behavior. The initial launcher Ghidra scan uses a 2 GiB heap and two logical CPUs at reduced priority. Full engine-DLL analysis and exact native patch recovery remain unresolved; neither can be inferred from wrapper flags, marketing or resource metadata.

Before native analysis, select and hash the actual comparator artifact, inspect available analysis state, and use the skill's supported recovery process for the specific missing capability. Do not modify licensing or session controls. Do not claim that decompilation reconstructs original C++ source or proves all 87 patches. Continue source and behavioral comparison independently when native analysis is unavailable.

## Current finding ledger

| Question | Evidence and conclusion | Status |
| --- | --- | --- |
| Which examples and mode defaults? | Exact source blobs above, source read only | Answered |
| Do basic/persistence require native patches? | Ordinary navigation and two-launch cookie/localStorage workflows pass on the qualified 155 runtime in both modes, without new engine changes | Answered for the measured workflows |
| Does 155 pass the five examples in both modes? | [Actual 155 measurements](reference-tests-155.md): basic/persistence pass and demo score 0.9 per mode, but Fingerprint Scan/CreepJS and detector suite fail; incomplete variants remain unqualified | Measured; overall target not achieved |
| How did historical 146 perform? | [Earlier measured report](reference-tests-prestable.md): basic passes; detector/CreepJS failures and unavailable variants remain | Answered for that historical runtime only |
| What are CloakBrowser's exact native changes? | Public wrapper, original resources and four partial source-bound native slice dossiers; no complete patch set | Partially answered for selected paths; full inventory unresolved |
| Is product parity established? | Local 155 validation and example measurements exist, but no paired exact-artifact comparison or all-integration qualification | Unresolved |

The initial Ghidra launcher inventory completed successfully (Evidence `ev_b6808de3249cfbe78cbbc4291b37c9b6f600c4121aee52d808c2cf334cfdd626`), reporting 12 segments, 7,350 local/external function entries and 3,664 defined strings. A separate source-built one-function DLL probe passed too (Evidence `ev_049136c2adc3fb387567778e80daf6bcc3362de957b52c18312fb551af5c0935`). Both owned analysis processes closed. These counts establish bounded provider observations, not complete code discovery, original C++ recovery or fingerprint-patch parity. The retained evidence preserves warnings/limitations; the full engine DLL has not been analysed.

**Subsequent bounded DLL checkpoint:** see the [native inspection report](cloakbrowser-native-inspection.md) and [sanitized summary](cloakbrowser-native-inspection-summary.json). Original-DLL resource inspection and four function dossiers from verified address-preserving slices are captured. Full-module passes remained incomplete, external callee coverage is partial, and runtime effects are unqualified. Analysis jobs closed under the CPU/memory limits while Chromium compilation continued. REA tools are now directly connected in this chat. Next work remains actual 155 build qualification followed by the documented SDK/configuration and rendering fixtures, not a claim that the advertised patch set has been reproduced.

**SDK/privacy continuation:** the [contract analysis](sdk-compatibility-privacy-analysis.md) adds a pinned source inventory and 26 own SDK observations using browser-free driver stubs. It distinguishes temporary regular profiles from isolated contexts, credential/routing data flows and specific adapter gaps. No native implementation or product parity is qualified by those probes.

The build and its configured local validation have completed. The bounded external measurements were subsequently executed at the user's request. No background implementation agent is scheduled. Resume from the next ready iteration using live state and saved evidence; historical setup/build notes above are not instructions to restart the completed compiler.
