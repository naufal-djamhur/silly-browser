# Chromium 155 Windows integration — 23 October 2026

The five-patch **Chromium 155.0.8059.80, Windows x64** build compiles, links and passes **48 local checks, with no failures or skips**. This qualifies the measured local integration paths below. The native download, registry release, staged distribution and complete MVP remain pending.

| Gate | Passed |
| --- | ---: |
| JavaScript engine identity, seed and profile lifecycle | 28 |
| Python integration | 5 |
| Native WebRTC policy/local STUN fixture | 1 |
| Context locale/timezone/DST/viewport isolation | 1 |
| Native invalid options and locale/timezone/worker/Ahem fixture | 2 |
| Playwright JS SDK/CDP, Puppeteer CDP, Python Playwright, Selenium; both modes | 10 |
| Optional ten-face Noto font package; both modes | 1 |

The native environment fixture uses process flags without SDK locale/timezone emulation. Document, iframe, dedicated/shared/service worker values, HTTP language and Paris DST offsets agree. The native Ahem `local()` font load measures the expected 80-pixel advance. Each of ten Noto faces loads and matches its expected advance width in both modes; all ten were unavailable in each host-font baseline and became available with the optional directory. This is narrow native loading/rendering evidence, not full OS font equivalence.

The exact source commit remains `43a195105613ac83c21d3f14de279f4a045c7da0`. Executable SHA256 is `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052`; runtime DLL SHA256 is `ed8619bbe2f4b087fa8e67628b16527393ce5498df596c27ac36fd9f19b5b04b`. [The sanitized summary](engine-validation-155-summary.json) binds results to this pair, all five patch digests and the raw evidence digests. Raw local reports retain their original paths and private host details outside the public repository.

## Recovery and validation

The resumed build first exposed a missing local command-line reference in `SandboxInitialized`. After that compile repair, the first complete link exposed an early diagnostic shutdown crash. CDB showed `PreSandboxStartup` calling the CRT exit path, followed by an access violation in `DllMain` during process detach. Our native early exits now use Chromium's `base::Process::TerminateCurrentProcessImmediately`, with `fflush(stdout)` before successful diagnostic termination. The native invalid-option gate confirms errors are rejected, and the diagnostic returns successfully before all other engine checks run.

The context fixture then waited for an intentionally empty iframe body to be visible. Installed stock Chrome **156.0.8078.47** and this custom 155 build both reported height zero, an attached body and a ready script. The fixture now waits for attachment; its locale, timezone, DST, viewport, header and isolation assertions remain intact. This stock 156 control establishes that narrow fixture issue; it is not an independent unpatched 155 control or qualification of a custom 156 product.

The already-passing 28 JS, five Python and local STUN results were retained only after matching their executable/DLL hashes and all result statuses. A validation continuation ran the corrected context, native environment and ten driver gates on the unchanged binary. The optional-font helper then verified the successful main receipt and both runtime hashes before running its own both-mode fixture. The native compiler is no longer running.

## Continue from here

Preserve this runtime and evidence. Use a new, dedicated profile for manual testing; keep the historical 146 profile separate. Supply this exact local executable to the SDK until a complete runtime is staged, extracted, tested, licensed and published.

Next iterations include owned interaction/extension/proxy fixtures and the unfinished [MVP gates](mvp-release-status.md). Managed-language policy, host timezone changes, UI resource fallback, full font enumeration, IPv6/TURN/proxy routing, Linux/macOS native products and broader rendering policies still require their own evidence. This local qualification checkpoint collected no detector scores. A subsequent [both-mode reference measurement](reference-tests-155.md) records the actual external observations and overall benchmark failure. Neither report establishes reference-product parity, universal driver compatibility or a production support range.
