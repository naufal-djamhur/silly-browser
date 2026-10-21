# SDK compatibility and privacy analysis — 22 October 2026

This iteration completes a bounded review of the selected public SDK launch contracts and reproduces specific silly-browser adapter gaps. **Product parity is not established.** It adds no browser C++ patches, changes no active build inputs and executes no CloakBrowser binary. Chromium 155 remains in its separate incremental compilation.

## Evidence boundary

The reference is public wrapper revision [`160f56da85860e89f0e7d9bfdc80266b984057d5`](https://github.com/CloakHQ/CloakBrowser/tree/160f56da85860e89f0e7d9bfdc80266b984057d5). The [source inventory](reference-sdk-inventory.json) records 14 reviewed file identities, six Python launch signatures and three JavaScript launch interfaces. The selected files were clean at that pin. This source pin differs from the five-example pin in the [comparison plan](cloakbrowser-comparison-plan.md); neither upgrades the inspected free 146 binary to a current 155 comparator.

Two reproducible probes produced **26 observations**: [13 JavaScript observations](sdk-contract-js-observations.json) and [13 Python observations](sdk-contract-python-observations.json). They use the actual own SDK validators and replace driver launch functions with stubs. They exercise option forwarding, rejection and limited successful-close cleanup without starting Chromium, making external requests or downloading a runtime. The reports bind observations to own SDK SHA256 values. They do not test page behavior, rendering, network routing or actual browser shutdown. Reproducing a missing option is evidence of a gap, not a passing product feature.

Retained native REA views were reused without reopening Ghidra:

- Locale view `ev_150b136db065e2b746301315f5167b766be7e17f2878891a1ab49c87b5d3648a` projects parent `ev_932ad5c9a11a710d16a231357d568311bb3d9937ec1e1a1dd94ff16572558547`. The selected path tests option presence and a nonempty retrieved value before calling unresolved conversion/output helpers. This does not establish locale validation, normalization or worker coverage. Twenty call targets remain unresolved and type propagation warns.
- Font value-flow view `ev_a0619ec498e93e8c34118d99af47fd659b15964d322d19b2d817c936d78461da` projects parent `ev_b6b51ba25eea0178245158fd541163156b1fc9203844768a3de6ca21c77f4962`. It retains 3,000 operations with truncation, at least one omitted operation and 2,954 known omitted def-use edges. Exhausting this summary view does not complete the function's value flow or establish directory loading.

Both refer to the verified analytical slice, SHA256 `f3a82793b25eed3865b006faedff28182d9807c185089782c1c104e38b258b99`, with the original-DLL binding and omitted-range limits in the [native inspection](cloakbrowser-native-inspection.md). The exported local bundle retains the parents and views; no raw decompiler text or binary is redistributed in this report. These views do not increase the number of analysed functions.

## Contract comparison

Reference behavior below is **source-observed wrapper behavior**, not independently qualified native behavior. Own driver-boundary observations are also separate from finished-155 runtime qualification.

| Contract | Pinned reference SDK | Silly-browser finding | Required follow-up |
| --- | --- | --- | --- |
| Return types | Python sync/async Browser, isolated context and persistent context APIs; JS Playwright equivalents | Equivalent broad entry-point names exist | Specify ownership, persistence and close semantics, not just return type |
| Plain launch locale/timezone | Reference builds native launch arguments | JS accepts but drops the fields; Python sync/async rejects them | Decide explicit API scope; never silently accept ineffective fields |
| Profile-context locale/timezone | Reference routes through process-level binary options; context overrides are filtered | Own JS and Python forward driver context options; Python async agrees in the probe | Test Date/Intl/navigator/header behavior; preserve documented context isolation rather than copying a global override |
| Viewport | Reference has explicit context viewport controls and version-dependent defaults | Own JS profile context forwards it; Python profile context rejects it and always enables no-viewport; JS plain launch drops it | Shared contract for omitted, null and explicit dimensions in both languages and modes |
| Timezone alias | Reference context APIs accept timezoneId/timezone_id aliases | Own SDK exposes timezone; generic unknown fields reject aliases | Document the spelling or deliberately add aliases with conflict rules |
| Context settings | Reference exposes user agent/color scheme and extra context options | Own high-level APIs reject generic contextOptions/context_options; direct Browser.newContext remains a driver API | Add a typed, validated context builder if needed; do not weaken lifecycle or sandbox guards |
| Temporary context | Reference launchContext creates a context with Browser.newContext | Own launchContext uses an owned temporary **regular disk-backed profile** | Declare disk retention/cleanup semantics; the two APIs are not storage-equivalent |
| Persistent profile | Reference reopens a user directory and stores its own seed metadata | Own SDK uses its own seed metadata and user directory | Runtime restart, locking, state isolation and failure-cleanup tests; no profile migration guarantee |
| Seed corruption/publication | Reference warns and regenerates corrupt metadata, with a no-hard-link fallback | Own implementation rejects corrupt metadata and requires atomic hard-link publication | Document the deliberate policy difference; cross-filesystem support remains unqualified |
| HTTP authentication | Reference chooses native inline credentials or driver credentials using a platform/version capability gate | Own Playwright separates credentials from the server URL and argv; Puppeteer rejects authenticated proxies | Owned local 407 challenge/CONNECT/redirect tests; credentials must remain redacted |
| SOCKS5 authentication | Reference emits a native proxy argument | Own JS/Python reject credentials explicitly | Requires independently implemented transport support and actual routing fixtures; source wrapper flags alone are insufficient |
| Proxy bypass | Reference object form carries a bypass policy through its selected transport | Own Puppeteer forwards server but **drops bypass**, reproduced at its driver boundary | Forward or reject explicitly; validate included/excluded destinations on local fixtures |
| Driver request client | Reference explicitly warns when native-only proxy arguments do not configure Playwright's request client | Own Playwright uses a driver proxy object; own Puppeteer has a separate route | Test page fetch, APIRequestContext and route.fetch separately before promising a proxy policy |
| Extensions | Reference builds extension-path arguments | Own plain Playwright launch rejects extensions; profile paths build flags | Test a harmless unpacked extension in actual supported modes; do not assume flags establish loading |
| Custom integration helpers | Reference exports launch and context option builders | Own exports launch builder; there is no shared exported context builder | A typed context builder can close SDK integration gaps without a C++ patch |
| Raw arguments | Reference declares a string-array/list contract | Own JS rejects a string; Python turns it into character arguments | Reject string/bytes/mapping/non-string elements before starting drivers or touching profiles |
| GeoIP | Reference opt-in resolution can download a database and contact egress-IP echo services | Own explicit geoip request is rejected | Define explicit network/data policy before implementation; explicit locale/timezone can remain sufficient |
| Binary acquisition/version pin | Reference includes release selection, binary cache/download and signature/checksum paths | Own SDK requires an explicit executable and custom-engine handshake | Build a separately qualified distribution/update layer only when releases exist; current setup is not an installer product |
| CDP and drivers | Reference includes integration examples | Own compatibility runner covers five driver routes in both modes | Execute on actual 155; published examples are not universal driver compatibility |
| Native WebRTC privacy | Reference native semantics were not traced in this pass | Own three-patch 155 series maps an explicit policy through Chromium renderer preferences, leaving managed policy authoritative | Existing local STUN fixture qualifies only IPv4 direct UDP; add managed/per-origin, IPv6 and TURN/proxy cases separately |
| Fonts/GPU/storage | Native font/storage paths are partial; reference font helper checks host availability and warns | No complete font-collection, GPU equivalence or storage policy qualification | Use real host rendering/accounting fixtures; this is not supplied by an SDK option or platform label |

## Privacy data flows and acceptance requirements

**Profile state:** the own temporary context writes ordinary browser profile data to disk during a session. Successful stub-close cleanup was observed only for the JS-owned directory; crash cleanup, antivirus/file-lock interference and actual browser termination are unqualified. A temporary path is not an in-memory or secure-erasure guarantee. Keep caller-owned persistent directories intact on errors. A profile lifecycle fixture should write cookie/localStorage/IndexedDB state, close/reopen, inspect isolation and verify owned-directory cleanup after actual process exit.

**Proxy credentials and routing:** the own JS/Python option probes confirm that synthetic HTTP credentials are separated from argv and server URLs, but the launch option objects still contain sensitive credentials. Do not log these objects. The reference native inline-auth wrapper intentionally puts credentials in a process argument on qualified versions; adopting that shape is not necessary for compatibility. A future authenticated transport must consider process visibility as well as successful authentication. No real credentials were used or published here.

An API request client and Chromium's page network stack are separate consumers. The reference's request-client warning identifies a source-level routing distinction; it is not proof of a leak in our current Playwright object-proxy path. Qualify these consumers independently, including bypass, redirects, authentication failures, DNS and WebSocket behavior. A launch-argument check cannot establish actual egress, DNS routing or absence of direct connections.

**GeoIP and acquisition:** the reference Python GeoIP resolver queries IP echo services through its supplied proxy, or directly when there is no proxy. Database retrieval and later refresh are additional data flows. The own SDK currently rejects GeoIP, so these reference flows must not be described as implemented own behavior. Any future resolver needs opt-in behavior, explicit offline/manual configuration, timeouts, cache scope, and a documented policy for unavailable or conflicting results. The reference binary updater is a separate supply-chain scope: reviewed code includes an official signed-manifest path and a custom-mirror path with different verification rules. This was not a complete cryptographic or extraction audit. No reference resolver, downloader or updater ran during this iteration.

**Native controls:** the own WebRTC source keeps managed policy authoritative. Its explicit policy is a real network-interface preference rather than fabricated ICE output; actual 155 effects still await compilation. The current fixture has a positive STUN control and checks actual packet absence for the requested policy. It does not cover every policy combination, managed/per-origin precedence, IPv6, TURN, DNS, UDP ASSOCIATE or general proxy isolation. Storage privacy likewise requires real quota/usage/write consistency, not a substituted reported number. Host font/GPU defaults require observation on the actual machine and platform.

**Overall network behavior:** none of these source or stub observations proves that Chromium startup is free of background traffic. A separate local capture/NetLog fixture is needed if a documented product policy makes that promise. No such promise is qualified here.

## Ordered implementation candidates

The active build's source and driver qualification inputs remain unchanged. These candidates are ready for subsequent review, with one reproduced gap per iteration:

1. **Argument validation:** require a Python list of strings and reject string/bytes/mapping input consistently. Test rejection before driver startup/profile creation. This is an SDK fix; no native patch is needed.
2. **Proxy bypass contract:** forward the supported bypass policy in the Puppeteer adapter or reject it explicitly. First add the driver-boundary regression; then prove inclusion/exclusion using local destinations on the finished engine. This is an adapter fix unless a real network-layer defect is reproduced.
3. **Context option contract:** introduce a common explicit context-options builder with locale/timezone/viewport mapping and precedence rules. Ordinary Browser launch should reject unsupported context-only fields or provide documented defaults through a deliberate API. Preserve driver-level context isolation and give Python the same viewport contract. Runtime tests must cover HTTP language, navigator, Intl, Date/DST, frames and declared workers in both modes.
4. **Profile lifecycle:** specify isolated-context versus temporary regular-profile behavior and add real close/crash/restart fixtures. Do not change a context's persistence class silently to resemble another product.
5. **Owned proxy/extension/privacy fixtures:** qualify HTTP auth, bypass, request-client routing, extensions and WebRTC policy before implementing larger native transports or font/storage policies. Bind every result to executable/DLL hashes and driver versions.
6. **Release packaging:** only after a qualified runtime, design platform packages, integrity verification, version selection and update behavior. Windows runtime evidence cannot qualify Linux/macOS packages or GPU/font behavior.

The [coverage ledger](native-analysis-coverage.md) remains partial for native recovery and runtime behavior. No full patch inventory, equal-version comparison or 1:1 product claim is established by this iteration.

## Reproduction

From the repository, use the configured supported Node/Python runtimes and an existing clean checkout at the reference pin. These commands do not download or launch a browser:

```powershell
node compatibility/sdk-contract-probe.mjs --output artifacts/sdk-contract/js.json
python compatibility/python_contract_probe.py --output artifacts/sdk-contract/python.json
python compatibility/reference_sdk_inventory.py --reference PATH_TO_PINNED_PUBLIC_CHECKOUT --output artifacts/sdk-contract/reference.json
```

The probes assert the currently observed gaps to detect drift. When a gap is fixed, update the probe and evidence deliberately rather than treating its old observation as an implementation requirement. The Python probe imports installed Playwright solely to replace its launch boundary; the reference inventory only parses source and reads Git metadata. Human-behavior layers, licensing implementation and anti-bot/CAPTCHA mechanisms were not analysed for reproduction.
