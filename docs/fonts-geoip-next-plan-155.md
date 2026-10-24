# Next implementation plan: diagnostic failures, fonts and GeoIP

**24 October 2026. Planning complete; font/GeoIP implementation has not started.** This follows the completed [patch-nine native geometry fix](geometry-media-155.md) and the [fresh patch-nine diagnostic rerun](detector-results-155-patch9.md). The requested detector outcome remains **unmet**. This plan defines the next product work and its proof requirements; it does not promise that fonts or GeoIP will remove the current automation classifications.

## Starting evidence and acceptance

| Gate | Current measured result | Required outcome |
| --- | --- | --- |
| Fingerprint Scan, headed | Bot risk 100/100 — fail | Complete numeric result <10 |
| Fingerprint Scan, headless | Bot risk 100/100 — fail | Complete numeric result <10 |
| CreepJS, headed | Headless 33%, stealth 0% — fail | Headless <=30% and stealth <=30% |
| CreepJS, headless | Headless 100%, stealth 0% — fail | Same thresholds |
| Native geometry correctness | Patch nine: 16/16 observations pass | Preserve all scoped contracts |
| Existing compatibility | 36 lifecycle observations, four prior timezone cases, 106 Node tests, five Python checks and ten driver routes pass | No relevant regression |

These diagnostic thresholds come from the retained reviewed reference example. Do not weaken them, remove assertions, filter failed captures, or call a collector's zero exit code a detector pass. CreepJS like-headless is informational in that example's pass expression. A missing, incomplete, challenged or failed collection is unavailable/error, never a pass.

The fresh run has four complete failures, zero collection errors and unchanged runtime hashes. The environment is Windows x64 Chromium **155.0.8059.80**, nine release-specific patches, raw Python Playwright 1.62.0, configured 1920×1080 viewport and DPR 1, no proxy, native overrides or optional font pack. The qualified runtime is `work/qualified/155-geometry-media-20261024/`; DLL SHA256 is `21e04f73104e3f44070953950444e36148bdf717b79ab1052442ef4f462abff1`.

## What currently explains the failures

| Finding | Evidence and implication | Next action |
| --- | --- | --- |
| CreepJS main headless group | `webDriverIsOn=true` both modes; headless mode additionally has page/worker headless UA flags | These explain the 33%/100% calculation. They are observations of active automation/mode, not a font fallback or timezone failure |
| Fingerprint Scan browser group | WebDriver/CDP/context checks positive; browser category +305/+480 HIGH | Preserve exact public observations; private per-rule weights remain unknown. No counterfactual score can be derived from the category total |
| Fingerprint Scan hardware group | Public reason 0 LOW in this run | No evidence that a missing font/GPU patch causes this run's hardware score |
| Fingerprint Scan network group | +49/+50 MEDIUM despite no configured proxy | A category total is insufficient to identify a routing defect. Use owned transport observations before selecting a native fix |
| Configured display/media heuristics | No available-screen gap and light preference match the declared context configuration | P1 demonstrates native geometry and media propagation correctness. Do not invent taskbar dimensions or change preferences merely to alter a heuristic |
| CSS resolution bug | Dynamic DPR-only updates were inconsistent on patch eight and upstream 155; patch nine fixes them | Already completed, with RED/GREEN proof. The static external rerun still fails |

The current evidence does **not** support a plan claiming that a font bundle or GeoIP setting will make these benchmarks pass. Their product acceptance and diagnostic acceptance remain separate. Native fixes address demonstrated incorrect behavior; changing truthful automation indicators solely to change a classifier is not part of these correctness milestones. If the detector gates remain red after the work below, record them as unmet rather than advertising a completed detector-compatible product.

## Reviewed reference features and actual local gaps

The public sources were frozen at CloakBrowser commit [`f0d904c4772eec0fa8a1b07309ec6ba230061bb5`](https://github.com/CloakHQ/CloakBrowser/tree/f0d904c4772eec0fa8a1b07309ec6ba230061bb5). [The review receipt](fonts-geoip-source-review-155.json) records file hashes and scope. This is a review of the two requested modules, not full native-engine recovery or a current CloakBrowser binary qualification.

The referenced [fonts.ts](https://github.com/CloakHQ/CloakBrowser/blob/f0d904c4772eec0fa8a1b07309ec6ba230061bb5/js/src/fonts.ts) checks Linux host font availability and has a once-per-environment warning. It does not install/bundle all listed fonts. It contains eight Windows, ten Office and twenty macOS family probes; Office absence is treated separately. Enumeration failure means unknown. Our browser already retains Windows system fonts and can add the separately installable ten-face Noto core pack. Missing work is a truthful host-font diagnostic and broader licensed script/fallback coverage.

The referenced [geoip.py](https://github.com/CloakHQ/CloakBrowser/blob/f0d904c4772eec0fa8a1b07309ec6ba230061bb5/cloakbrowser/geoip.py) combines exit-IP discovery, a cached city database, timezone lookup and a country-derived locale, with optional dependencies, timeout handling and refresh. Our JavaScript and Python SDKs currently reject `geoip=True`; this is an actual unimplemented product feature. Treat exit-IP output as routing evidence; WebRTC policy remains separately configured.

Do not copy proprietary Windows/macOS font files into public npm/PyPI archives. Use installed/user-provided fonts and redistributable packs with their own notices. The [current font comparison](font-compatibility.md) distinguishes the reference's Linux recipe from our smaller Noto core pack. Reference helper code is MIT; preserve its notice if code is reused. Font/data licenses remain separate from helper-code licensing.

## Ordered iterations

### D0 — Current baseline and failure dossier: complete

Deliverables are the [four fresh observations](detector-results-155-patch9.md), [sanitized scores/checks](detector-results-155-patch9-summary.json), pinned reference review and this plan. Preserve private raw text/HTML/screenshots/public objects. The published CreepJS headless source was separately pinned to [`10aa6724cd33a1015db1574211890518cd04f0cc`](https://github.com/abrahamjuliot/creepjs/blob/10aa6724cd33a1015db1574211890518cd04f0cc/src/headless/index.ts); that source snapshot does not independently establish the deployed site's exact revision.

**Exit met:** each current failure is measured and distinguished from native correctness. No new compiler or native patch was needed for D0.

### F1 — Host fonts and licensed coverage: first ready implementation

1. Specify the requested inventory result: requested families, actually present/missing families, enumeration backend and `complete`/`incomplete`/`unknown`. Do not use substring matching that makes one family accidentally satisfy another. Missing fontconfig or an enumeration error must remain unknown.
2. Add matching explicit diagnostic entry points to the JavaScript/Python font packages. Use the actual host collection/fontconfig where supported. Qualify the Windows path against DirectWrite; do not advertise an untested Linux/macOS path as supported. Keep diagnostics separate from automatic launch identity changes.
3. Preserve `fontPack: 'noto-core'` / `font_pack='noto-core'` and custom directory support. Add a separately named broader redistributable pack for the agreed Arabic, Devanagari, Thai, CJK and emoji coverage, preserving the existing core package size/behavior. Select actual supported font formats before adding assets; color-font support must be measured on the native renderer.
4. Pin every upstream file/revision, byte size, SHA256, real family/face metadata and license notice. npm and Python archives must contain identical inventoried font bytes. Package installation must not register fonts globally or change the OS font configuration.
5. Execute P2 owned rendering fixtures: native local loading and fallback, supported-script shaping, missing-glyph handling and document/worker canvas metrics where supported. Compare with the same font data on the upstream control; control host-existing fonts so a successful name lookup is not mistaken for proof that the package supplied it.

**Files:** `packages/fonts/`, `sdk/js/font-options.mjs`, `sdk/python/custom_browser/__init__.py`; extend `tests/font-pack.test.mjs`, `tests/native-font-pack-browser.test.mjs` and Python package checks. Inspect `ui/gfx/win/direct_write.cc` / font proxy C++ only after a reproducible loader/fallback failure or a specified native diagnostic capability needs that layer.

**Exit:** truthful audit states; archive/license/checksum checks pass; new faces/scripts and existing system fallback work in both display modes. Record unsupported formats/platforms explicitly. No generic claim that every Windows/macOS font is bundled or every language is qualified.

### G1 — GeoIP resolver and data lifecycle

Depends on D0 and a written option schema; independent of F1 asset work.

1. Keep `geoip` opt-in, false by default. Define a shared result `{ip, country, timezone, locale, databaseVersion, localeSource}`. Country-derived locale is a configurable default, not proof of the user's preferred language. Explicit caller timezone/locale wins over inferred values.
2. Implement optional database readers in JS/Python, with exact dependency versions in the lock/build evidence. Support an explicit local MMDB path first, including offline resolution for a caller-supplied IP. Missing records, invalid IPs, corrupt databases and unsupported timezones must produce useful typed errors or the explicitly specified partial-result policy; no invented location.
3. Add a separate database install/update command: versioned shared cache, bounded download, byte/hash verification, atomic replacement, concurrent-install lock, interrupted-download recovery and visible data version/age. No download from a pure option builder or ordinary `geoip:false` launch.
4. Select and document a permitted data source before enabling automatic first use. Official [MaxMind GeoLite guidance](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/) describes free data, authenticated access and imprecision. Do not assume the reference's third-party mirror grants redistribution rights or guarantees freshness. User-provided data works without bundling a public database asset; automatic download remains unqualified until its source/terms/integrity metadata are recorded.

**Exit:** shared IPv4/IPv6 fixtures return the same timezone/country/default locale in both SDKs; invalid/missing/corrupt/stale data and concurrent cache access have defined outcomes; no network activity in offline/disabled modes. The database's licensing and distribution method are explicit.

### G2 — Actual egress discovery and proxy transport

Depends on G1's result/error schema and existing supported proxy normalization.

1. Query an IP echo endpoint through the configured route using an explicitly bounded total timeout, including retries. Validate the response as an IP; cap response size; retain TLS verification. Configured proxy authentication must stay in proxy authentication, never origin headers or logs.
2. Never silently retry a failed proxy through a direct connection or substitute the proxy gateway's DNS address for a measured exit IP. Record how bypass rules affect the selected route rather than assuming one IP applies to every destination.
3. Support only currently qualified proxy schemes/authentication. Authenticated SOCKS5 remains a separate unimplemented native capability; reject it before discovery. Do not use this iteration to claim UDP ASSOCIATE/QUIC support.
4. Cache lookup results by observed IP and data version, not credential-bearing proxy URLs. Respect rotating proxies and cancellation; do not reuse a result across a changed route without a stated freshness policy.

**Tests:** owned HTTP/CONNECT fixtures with inline and structured proxy credentials, denial/unreachable/timeout responses, bypass behavior, IPv4/IPv6 response parsing, TLS failure, oversized/malformed responses and credential redaction. No real paid proxy or private credential is required to exercise these contracts.

**Exit:** direct mode and each supported proxy route have measured success/failure behavior; no direct fallback on proxy failure; predictable timeout/cancellation and resource cleanup. External exit-IP services remain an opt-in dependency whose availability can fail.

### G3 — Launch integration through supported native configuration

Depends on G1/G2; preserve browser/profile ownership and pure option-builder behavior.

- Proposed user surface: existing `geoip:true` / `geoip=True`, with a separately validated configuration object for database path, timeout and explicit IP. Finalize exact field names before coding. Expose an async JS resolver for custom integrations; `buildLaunchOptions()` remains synchronous and free of downloads/network calls.
- Resolve settings before writing persistent seed/profile state or starting a user session. Route inferred timezone/locale through the existing native `--custom-browser-timezone` / `--custom-browser-locale` capabilities so browser-level launches and workers receive the intended defaults. Reject conflicting raw flags and missing native capabilities. Existing explicit context overrides retain their documented precedence/scope.
- Cover JS Playwright browser/context/persistent paths, Python sync/async equivalents and Puppeteer. Puppeteer's current explicit locale/timezone rejection is a real integration gap to resolve before advertising support there. Do not silently ignore a field on an unsupported launch path.
- Use the existing standards-based WebRTC policies separately; a GeoIP lookup must not silently rewrite ICE candidates or hardware/network values.

**Exit:** owned page, headers, iframe, dedicated/shared/service-worker observations agree within their declared configuration scopes in both modes. Explicit overrides, persistent relaunch and separate contexts work; failed discovery leaves no orphan process/profile/seed mutation. SDK/browser/driver compatibility is measured on the same candidate hash.

### D1 — Integration and fresh diagnostic measurements

Depends on the completed F1/G3 increments; can run after either independently to attribute changes.

1. Run the new feature-specific owned tests first. A native defect requires baseline RED, owning-layer cause, a minimal independent C++ patch, exact patch verification, separate candidate compilation and both-mode GREEN proof. Preserve the nine-patch runtime; add CB-0010 only for an actual native implementation change.
2. Run affected existing regressions and the ten driver routes. Broaden once for a final native candidate; avoid repeatedly rerunning unrelated suites after documentation-only changes.
3. Compare feature-disabled and explicitly enabled configurations, with matching viewport/platform/backend and exact binaries. Use the same routes when investigating locale/network agreement. Label saved CloakBrowser 146 results historical/version-confounded; current same-version reference parity is unqualified without an available reference runtime.
4. Rerun both public sites in both modes, retaining raw data privately and publishing sanitized check-level results. For a reliability claim, obtain at least three complete runs per mode/site over separate launches; publish every failure/unavailable result. If site code/collector changes, record its revision/hash and stop treating scores as directly comparable.
5. Keep the unchanged detector gates visible. If they remain red, the milestone is a qualified product feature with an unresolved detector goal. Scores are not inferred from font/GeoIP installation, native patch count or compatibility passes. Do not rename expected active-automation signals as a Chromium defect without an independent broken API contract.

**Exit:** each feature has an implementation/test result and a truthful external outcome. Passing the requested detector goal means actual complete observations meet both sites' unchanged criteria in both modes; this plan alone and the current native correctness evidence do not meet that exit.

## Dependencies, preservation and continuation

| Order | Work | Ready state | Deliverable |
| --- | --- | --- | --- |
| 0 | D0 measurements/source review | Complete | Fresh nine-patch failure dossier and pinned modules |
| 1 | F1 / P2 fonts | Ready to specify exact audit/pack contracts | Font diagnostic plus licensed rendering evidence |
| 2 | G1 | Ready after option/data-source contract | Offline resolver, optional dependencies and data lifecycle |
| 3 | G2 | Depends on G1 schema | Tested egress/proxy behavior |
| 4 | G3 | Depends on G1/G2 | All supported launch-path integration |
| 5 | D1 | After each finished feature / final candidate | Native regression evidence and fresh scores with honest pass/fail |

Execute one ready implementation iteration at a time. The user has requested the features; no additional approval is needed for routine reversible code/tests. Do not start another broad Chromium build merely to implement SDK/data management. If a native change is justified, preserve every prior output and compile a separate candidate.

Preserve source revision `43a195105613ac83c21d3f14de279f4a045c7da0`, the exact nine-patch release series, all five/six/seven/eight/nine-patch runtimes, upstream/reference controls, manual profiles and separately owned legacy changes. Update [the handoff](session-handoff.md), this plan and each feature's evidence after every iteration. No registry/native release is qualified by this planning checkpoint.

**Next-session instruction:** read this plan, the patch-nine diagnostic report and the source-review receipt. Confirm live process state and preserve the completed runtime. Start F1 with the exact font audit/asset/rendering contract, then follow G1–G3. Keep the detector gate unmet until actual measurements meet it; do not claim that fonts or GeoIP alone solve the currently observed automation classifications.
