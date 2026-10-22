# Chromium 155 compatibility patch checkpoint — 23 October 2026

The native compilation blocker is repaired in the **155.0.8059.80** patch series and its stopped checkout. The previously failing `navigator_base.cc` translation unit passes a direct **clang-cl `/Zs` syntax check using its original build arguments**. The exact ordered three-patch checkout verification also passes. The full build has **not** restarted, no stable runtime has linked and native browser behavior remains unqualified.

The stopped pipeline recorded 33,095 completed actions and 33,363 remaining at its failure. These are historical scheduler counts, not a completion-time estimate. Preserve its completed output and resume incrementally after this checkpoint; do not resync dependencies, reapply the whole series or touch the separate legacy candidate.

## Native change

The platform patch called `blink::String::FromUTF8`, which is not the API in this Chromium revision. It now calls **`String::FromUtf8(preset->navigator_platform)`**. The selected Blink header provides the `std::string_view` overload. This repairs the version migration without adding another patch or changing the intended platform policy. The three-patch manifest's capability count is unchanged.

The fixed translation-unit SHA256 is `32454156b6e9c6e8048b7876783adfca33ac1b9f63fa29ed2ed68badc6b0678f`. Updated patch hashes are recorded in [rebase evidence](../engine/releases/155.0.8059.80/rebase-evidence.json). A first validation invocation exceeded cmd.exe's command-length limit before compiler startup; the subsequent direct compiler invocation passed. Neither invocation resumed the browser build or linked a runtime.

## Completed companion SDK changes

- Exported JS `buildContextOptions()` and Python `build_context_options()` map locale, timezone and explicit viewport settings. They validate input shape; ICU identifier validity remains a browser check. Python sync/async profile contexts now support viewport dimensions without simultaneously setting no-viewport.
- Ordinary Browser launch rejects context-only settings explicitly. Callers can create independently configured BrowserContexts using the builders, or use profile-context launch. This removes the silent JavaScript field drop while preserving context scope.
- Python raw arguments must be a list of strings. Invalid options fail before profile creation or driver startup.
- Puppeteer forwards the configured proxy bypass list, including an explicit empty value. Malformed JS bypass values are rejected. Actual network routing remains pending a runtime fixture.

These close source/adapter gaps in the [prior analysis](sdk-compatibility-privacy-analysis.md). The historical observation reports remain intact. New [JS](sdk-contract-js-postpatch-20261023.json) and [Python](sdk-contract-python-postpatch-20261023.json) reports retain 26 post-change driver-boundary observations and their current source hashes. They do not establish native behavior.

## Validation

The regressions were run before implementation and reproduced missing context support, dropped bypass and invalid Python argument handling. After implementation:

| Check | Result | Scope |
| --- | --- | --- |
| Previously failing native translation unit | Syntax check passed | Compiler/type compatibility only; no object/link/runtime qualification |
| Ordered stable checkout verification | Passed | Exact patched bytes against the upstream lock |
| Selected JS SDK/configuration/profile/capability checks | 12 passed, 1 skipped | Includes six new SDK contract regressions; historical-engine check skipped without its executable |
| New Python SDK regressions | 8 passed | Includes sync/async forwarding and preflight rejection |
| Existing Python seed/release selection checks | 4 passed | Profile publication and release-lock invariants |
| Post-change probes | 13 JS + 13 Python observations captured | Stubbed driver boundaries only |
| New local both-mode context fixture | Syntax checked; runtime deferred | Actual 155 document/iframe/header agreement, viewport, DST and two-context isolation |

The new `npm run test:context` fixture requires the actual completed engine through `CUSTOM_BROWSER_EXECUTABLE`, matching `CUSTOM_BROWSER_RELEASE`, and optionally `CUSTOM_CONTEXT_REPORT` for a fresh output path. It hashes the executable/runtime DLL and marks the run incomplete if any assertion fails. It does not silently qualify a skipped run or substitute the historical engine. Worker coverage remains outside this fixture.

## Native continuation

Resume the existing 155 build incrementally and finish its engine/driver/WebRTC gates. Then run the context fixture in both display modes and bind results to the linked executable/DLL hashes. The five already-pinned CloakBrowser examples remain the reference measurement set; the user does not need to supply them again. The stated production environment includes DataDome and AWS WAF, but their results have not been measured on the new engine. A public demo score does not establish the decision of a separately configured production service.

Choose further C++ changes from reproduced native correctness or documented privacy-policy failures, with the failing fixture and expected behavior recorded first. No equal-version native product comparison or passing detector result is established at this checkpoint.
