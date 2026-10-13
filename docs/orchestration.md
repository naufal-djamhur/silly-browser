# Plan-Orchestrate Result

**Plan**: `docs/implementation-plan.md`
**Steps**: 26
**Scope**: all
**Emitted**: 21 · **Blocked**: 5

Generated from the plan using the installed ecc:plan-orchestrate skill and its documented command forms. These lines are suggestions only; none has been invoked. First read the session handoff, inspect actual build state and choose one ready iteration. Commands select their own execution behavior; this guide does not compose or schedule agent chains.

BLOCKED here describes a command-routing limitation, not a failed feature or missing user authorization. Build, standalone validation and final review iterations can be performed directly from the plan in a normal session. `/build-fix` may not detect a Chromium checkout from the SDK repository, so give a resumed session the actual build context before using it. The final documentation pass may use `/update-docs` manually; it cannot carry step scope either.

## Steps overview

| # | Title | Tags | Command | Status |
|---|---|---|---|---|
| 1 | Complete or repair the first native compilation | build | `/build-fix` | BLOCKED — cannot carry plan scope |
| 2 | Test the current custom engine and driver paths | test | `/test-coverage` | BLOCKED — cannot carry plan scope |
| 3 | Upgrade the integration engine to a supported stable revision | migration | `/orch-change-feature` | emitted |
| 4 | Implement native graphics, font and screen diagnostics | impl | `/orch-add-feature` | emitted |
| 5 | Design coherent rendering and profile policies | design | `/plan` | emitted |
| 6 | Implement the first canvas and geometry policy | impl | `/orch-add-feature` | emitted |
| 7 | Implement the audio privacy policy | impl | `/orch-add-feature` | emitted |
| 8 | Implement measured font and display consistency improvements | impl | `/orch-add-feature` | emitted |
| 9 | Implement native authenticated HTTP proxy handling | impl | `/orch-add-feature` | emitted |
| 10 | Implement authenticated SOCKS5 transport | impl | `/orch-add-feature` | emitted |
| 11 | Design SOCKS5 UDP and QUIC transport | design | `/plan` | emitted |
| 12 | Implement the approved UDP and HTTP3 transport design | impl | `/orch-add-feature` | emitted |
| 13 | Implement WebRTC privacy and routing controls | impl | `/orch-add-feature` | emitted |
| 14 | Implement explicit network exposure policies | impl | `/orch-add-feature` | emitted |
| 15 | Implement input scheduling and actionability coverage | impl | `/orch-add-feature` | emitted |
| 16 | Implement SDK launch and lifecycle parity | impl | `/orch-add-feature` | emitted |
| 17 | Implement opt-in GeoIP, timezone and locale resolution | impl | `/orch-add-feature` | emitted |
| 18 | Implement real extension and persistent-profile qualification | impl | `/orch-add-feature` | emitted |
| 19 | Implement an AI-friendly control adapter | impl | `/orch-add-feature` | emitted |
| 20 | Implement Linux platform qualification | impl | `/orch-add-feature` | emitted |
| 21 | Implement macOS platform qualification | impl | `/orch-add-feature` | emitted |
| 22 | Implement the qualified multi-version release matrix | impl | `/orch-add-feature` | emitted |
| 23 | Implement verified packaging and distribution | impl | `/orch-add-feature` | emitted |
| 24 | Test expanded drivers and reference integrations | test | `/test-coverage` | BLOCKED — cannot carry plan scope |
| 25 | Test repeated benchmark and performance outcomes | test | `/test-coverage` | BLOCKED — cannot carry plan scope |
| 26 | Review evidence and update release documentation | review | `/code-review` | BLOCKED — cannot carry plan scope |

---

## Step 1 — Complete or repair the first native compilation (blocked)

**Intent:** Observe the existing Windows Chromium 146 pipeline. If it failed, preserve the first actionable diagnostic, correct only that failure, verify the patched checkout and resume incrementally. A later session must inspect the actual process and log before starting another build.

**Tags:** build

**Command rationale:** /build-fix has no documented free-form step argument. This routing limitation does not block the engineering iteration; use the plan and normal session instructions for that work.

```text
BLOCKED — /build-fix cannot carry plan scope; run manually if wanted: /build-fix
```

## Step 2 — Test the current custom engine and driver paths (blocked)

**Intent:** Inspect the automatic ten-case driver report and identity test after compilation. Extend validation where the existing test is incomplete: native identity, all explicit platform presets, high-entropy Client Hints, frames, workers and invalid options. Repeat only missing or failed checks.

**Tags:** test

**Command rationale:** /test-coverage has no documented free-form step argument. This routing limitation does not block the engineering iteration; use the plan and normal session instructions for that work.

```text
BLOCKED — /test-coverage cannot carry plan scope; run manually if wanted: /test-coverage
```

## Step 3 — Upgrade the integration engine to a supported stable revision

**Intent:** Verify the current stable revision from official Chromium release data when this iteration begins. Rebase the existing ordered patches onto that exact commit in a separate checkout; keep the historical 146 evidence as an integration record.

**Tags:** migration

**Command rationale:** Changes the exact pinned engine revision; applicability and real-binary qualification travel with the task.

```bash
/orch-change-feature "[Plan: docs/implementation-plan.md#step-3] Upgrade the integration engine to a supported stable revision in silly-browser; Acceptance: Record the current stable commit, original-file hashes and an ordered applicable patch series.; The actual stable binary passes the handshake, identity and driver gates.; Support manifests distinguish qualified releases from historical or planned revisions.; Out of scope: Advertising an untested range of Chromium versions."
```

## Step 4 — Implement native graphics, font and screen diagnostics

**Intent:** Create a local diagnostic fixture and reproducible report for native GPU passthrough, WebGL/WebGPU availability, installed fonts, rendering, display scaling and window geometry. Record headed/headless differences and profile capabilities.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-4] Implement native graphics, font and screen diagnostics in silly-browser; Acceptance: Reports capture native graphics, font and display observations in both display modes.; Main-page, worker and rendering observations are checked for contradictions where their APIs are available.; Unavailable hardware features are recorded explicitly and native defaults remain reproducible.; Out of scope: Claiming that changing web identity emulates another operating system or its hardware."
```

## Step 5 — Design coherent rendering and profile policies

**Intent:** Write an architecture decision for explicit native and experimental privacy policies, persistent profile seed semantics and supported surface relationships. Choose an initial rendering family from the measured diagnostics before introducing source changes.

**Tags:** design

**Command rationale:** Produces a scoped architecture decision before the corresponding implementation.

```bash
/plan "[Plan: docs/implementation-plan.md#step-5] Design coherent rendering and profile policies in silly-browser; Acceptance: Document native behavior, opt-in policy behavior and supported combinations.; Specify fixture expectations and per-profile consistency across frames and workers.; Identify unsupported cross-platform combinations and the rollback switch for each policy.; Out of scope: Inventing unrelated GPU, fonts and screen values independently."
```

## Step 6 — Implement the first canvas and geometry policy

**Intent:** Introduce one bounded opt-in source policy from the rendering decision, preserving the native path. Cover its applicable canvas, OffscreenCanvas, export and geometry surfaces before adding another rendering family.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-6] Implement the first canvas and geometry policy in silly-browser; Acceptance: Native-mode fixtures retain their expected behavior.; The selected policy has deterministic profile behavior and documented frame/worker consistency.; A compiled binary passes rendering/export fixtures and records affected capabilities.; Out of scope: Additional rendering families before this policy has browser evidence."
```

## Step 7 — Implement the audio privacy policy

**Intent:** Add the explicitly designed opt-in audio policy and its native fallback. Validate offline and real-time behavior, numerical bounds, repeated profile behavior and worker availability where applicable.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-7] Implement the audio privacy policy in silly-browser; Acceptance: Offline and real-time audio fixtures complete without corruption or crashes.; The experimental policy is consistent within a profile and keeps changes within documented bounds.; Native-mode regression checks pass on the compiled engine."
```

## Step 8 — Implement measured font and display consistency improvements

**Intent:** Address contradictions demonstrated by the diagnostics with narrowly scoped font/display policies. Preserve real Windows GPU passthrough and disclose host font availability; web identity presets alone do not create a foreign graphics stack.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-8] Implement measured font and display consistency improvements in silly-browser; Acceptance: Actual font rendering and permitted enumeration are validated against the host environment.; Viewport, outer-window geometry, scaling and multiple-display cases have repeatable fixture results.; Native GPU values and native fallback behavior remain intact in both display modes."
```

## Step 9 — Implement native authenticated HTTP proxy handling

**Intent:** Implement engine-level parsing and authentication for configured HTTP proxies with inline credentials, independently of SDK-only Playwright authentication. Use a controlled proxy fixture and redact credentials from diagnostics.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-9] Implement native authenticated HTTP proxy handling in silly-browser; Acceptance: HTTP requests and HTTPS CONNECT succeed through an authenticated fixture.; Encoded credentials, rejected authentication, timeouts and browser/request-client scope are tested.; Proxy credentials never enter public reports or command-line diagnostics."
```

## Step 10 — Implement authenticated SOCKS5 transport

**Intent:** Add native SOCKS5 username/password support with explicit remote DNS, address-family and failure semantics. Both SDK languages should expose the same supported transport contract.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-10] Implement authenticated SOCKS5 transport in silly-browser; Acceptance: Authenticated SOCKS5 traffic and remote DNS pass controlled end-to-end fixtures.; IPv4, IPv6, denied authentication and timeouts have deterministic outcomes.; Python and JavaScript launch variants select the same engine capability and redact secrets."
```

## Step 11 — Design SOCKS5 UDP and QUIC transport

**Intent:** Produce a transport design and feasibility result for UDP ASSOCIATE and QUIC/HTTP3. Specify routing, connection lifetime, datagram limits and fallback behavior before implementing a new transport path.

**Tags:** design

**Command rationale:** Produces a scoped architecture decision before the corresponding implementation.

```bash
/plan "[Plan: docs/implementation-plan.md#step-11] Design SOCKS5 UDP and QUIC transport in silly-browser; Acceptance: An architecture decision describes UDP association, QUIC integration and routing evidence.; A controlled UDP/HTTP3 fixture and required network captures are specified.; Unsupported routes and safe fallback behavior are explicit."
```

## Step 12 — Implement the approved UDP and HTTP3 transport design

**Intent:** Implement only the transport design established in the preceding decision, using a controlled SOCKS5 server and HTTP3 origin. A feasibility result may narrow advertised support; it must not silently relabel direct traffic as tunneled.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-12] Implement the approved UDP and HTTP3 transport design in silly-browser; Acceptance: UDP ASSOCIATE and HTTP3 have end-to-end routing evidence through the configured proxy.; Association teardown, timeout, datagram limits and fallback fixtures pass.; Capabilities report unsupported proxy/server combinations truthfully."
```

## Step 13 — Implement WebRTC privacy and routing controls

**Intent:** Add explicit WebRTC privacy/routing policies and evaluate the requested proxy-exit-IP option against actual connectivity. Report candidate exposure and enforce documented routing instead of implying that a displayed address proves the media path.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-13] Implement WebRTC privacy and routing controls in silly-browser; Acceptance: ICE/STUN/TURN and IPv4/IPv6 fixtures record candidate exposure and actual routes.; Configured proxy/privacy policies fail clearly when a required route is unavailable.; Native mode and real peer connectivity have regression coverage."
```

## Step 14 — Implement explicit network exposure policies

**Intent:** Specify and implement justified privacy controls for proxy-related headers, cache metadata and timing exposure. Validate protocol correctness against native Chromium; document observable tradeoffs and request-client scope.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-14] Implement explicit network exposure policies in silly-browser; Acceptance: Controlled HTTP/cache fixtures record the configured policy behavior.; Connection reuse, redirects, TLS and diagnostics remain functional.; Native behavior, experimental policies and routing limitations are documented and verified.; Out of scope: Fabricating successful network routes or treating zero timings as proof of correctness."
```

## Step 15 — Implement input scheduling and actionability coverage

**Intent:** Complete configurable mouse, keyboard and scroll scheduling for documented SDK methods. Define how raw CDP and other drivers participate, and add engine hooks only when that contract requires them. Cover frames, hit targets, deadlines and cancellation.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-15] Implement input scheduling and actionability coverage in silly-browser; Acceptance: Visible/enabled/stable and hit-target checks work across nested frames.; Per-call human_config, cancellation and timeout behavior are consistent in both languages.; Supported raw CDP/driver operations have fixture evidence and unsupported methods are listed.; Out of scope: Guaranteeing that paced input passes behavioral detection or CAPTCHA scoring."
```

## Step 16 — Implement SDK launch and lifecycle parity

**Intent:** Complete the public Python sync/async and JavaScript API contract, including a real Puppeteer launch adapter, composable launch options, humanizeBrowser behavior, argument precedence and typed capability errors. Extend the scoped public SDK review as each API is implemented.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-16] Implement SDK launch and lifecycle parity in silly-browser; Acceptance: A versioned API matrix records return types, options and lifecycle guarantees.; Both languages and the Puppeteer adapter pass ownership, cleanup, cancellation and option-precedence fixtures.; Reviewed reference coverage and remaining gaps are updated without claiming a comprehensive proprietary engine audit."
```

## Step 17 — Implement opt-in GeoIP, timezone and locale resolution

**Intent:** Resolve GeoIP through the configured route with deadlines, explicit override precedence and cache behavior. Reuse a single approved lookup for timezone/locale and any exit-address consumer, and define context versus engine scope.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-17] Implement opt-in GeoIP, timezone and locale resolution in silly-browser; Acceptance: Proxy-route resolution and bounded failure behavior pass local/mock provider fixtures.; Explicit values override inferred timezone/locale consistently in Python and JavaScript.; Lookup reuse, cache boundaries and worker/context behavior are documented and tested."
```

## Step 18 — Implement real extension and persistent-profile qualification

**Intent:** Finish extension_paths across supported launch variants and validate a real extension, rather than only inspecting launch arguments. Qualify persistent storage, seed preservation, profile locking and crash recovery.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-18] Implement real extension and persistent-profile qualification in silly-browser; Acceptance: An extension content script and background worker execute on the custom binary.; Cookies, localStorage and seeds survive close/relaunch in supported APIs.; Temporary cleanup, profile conflicts and corruption/crash recovery have reproducible outcomes."
```

## Step 19 — Implement an AI-friendly control adapter

**Intent:** Add a documented local agent/MCP-style adapter over the supported browser operations, using explicit targets, structured observations and cancellation. Keep the control connection local by default and define access restrictions.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-19] Implement an AI-friendly control adapter in silly-browser; Acceptance: An agent can inspect a local fixture, choose an element, act and read the result through the documented interface.; Control binding/access rules and cancellation are validated.; Errors are structured and screenshots/DOM observations have bounded collection behavior."
```

## Step 20 — Implement Linux platform qualification

**Intent:** Create a reproducible Linux source/patch and qualification workflow for a declared architecture. Repeat native graphics/font observations, identity, drivers and implemented feature fixtures on an actual Linux binary.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-20] Implement Linux platform qualification in silly-browser; Acceptance: The declared Linux binary compiles from a pinned revision with the sandbox enabled.; Required native and implemented feature fixtures pass or have explicit unsupported statuses.; A versioned platform report includes binary hash, libraries and host prerequisites."
```

## Step 21 — Implement macOS platform qualification

**Intent:** Create a native macOS qualification workflow with declared architectures, platform toolchain and signing requirements. Windows web identity presets do not count as macOS execution evidence.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-21] Implement macOS platform qualification in silly-browser; Acceptance: A native macOS builder produces the declared architecture binary from pinned source.; Native graphics/fonts, driver paths and implemented feature fixtures have measured outcomes.; Signing/notarization prerequisites and unsupported architectures are recorded."
```

## Step 22 — Implement the qualified multi-version release matrix

**Intent:** Maintain separate ordered patch series, capability manifests and regression evidence for each supported exact Chromium release/platform/architecture. Include security-update and retirement policy; planned revisions remain unadvertised.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-22] Implement the qualified multi-version release matrix in silly-browser; Acceptance: Every advertised tuple has source revision, patch hashes, binary hash and feature/driver results.; Rebase and regression procedures are reproducible for each maintained line.; Security update deadlines and removal of obsolete release lines are documented."
```

## Step 23 — Implement verified packaging and distribution

**Intent:** Add release packaging and a downloader that binds version/platform/architecture to verified archive contents. Separate build reproducibility, archive signatures and OS code signing, and preserve Chromium/component license notices.

**Tags:** impl

**Command rationale:** Creates a concrete capability; fixture and native-mode criteria travel with the task.

```bash
/orch-add-feature "[Plan: docs/implementation-plan.md#step-23] Implement verified packaging and distribution in silly-browser; Acceptance: Manifest signatures, archive hashes, requested version binding and safe extraction are enforced.; Packages preserve required notices and record OS signing/notarization status.; Tampering and wrong-version/wrong-platform fixtures fail before launch.; Out of scope: Publishing release binaries before their declared qualification gates pass."
```

## Step 24 — Test expanded drivers and reference integrations (blocked)

**Intent:** Expand actual-binary compatibility beyond the ten smoke checks. Exercise pinned public reference examples that apply to the project, including undetected-chromedriver, and record environmental/dependency blockers without marking them passed.

**Tags:** test

**Command rationale:** /test-coverage has no documented free-form step argument. This routing limitation does not block the engineering iteration; use the plan and normal session instructions for that work.

```text
BLOCKED — /test-coverage cannot carry plan scope; run manually if wanted: /test-coverage
```

## Step 25 — Test repeated benchmark and performance outcomes (blocked)

**Intent:** Run repeatable correctness/privacy measurements and the listed public demo probes where permitted, separating missing data from numerical scores. Compare stock and custom binaries under matched conditions and measure resource use and concurrency.

**Tags:** test

**Command rationale:** /test-coverage has no documented free-form step argument. This routing limitation does not block the engineering iteration; use the plan and normal session instructions for that work.

```text
BLOCKED — /test-coverage cannot carry plan scope; run manually if wanted: /test-coverage
```

## Step 26 — Review evidence and update release documentation (blocked)

**Intent:** Review the final implementation and evidence, reconcile README/API/support manifests, and publish an accurate release checklist and changelog. An unresolved required gate keeps the corresponding feature or release experimental.

**Tags:** review

**Command rationale:** /code-review has no documented free-form step argument. This routing limitation does not block the engineering iteration; use the plan and normal session instructions for that work.

```text
BLOCKED — /code-review cannot carry plan scope; run manually if wanted: /code-review
```

## Batch execution

Reference aggregation of emitted commands, in plan order. Dependencies and build-state gates still apply: use one ready command at a time. This block is not an automatic execution script. Blocked steps are excluded:

- Step 1: `/build-fix` cannot carry plan scope; manual form: `/build-fix`.
- Step 2: `/test-coverage` cannot carry plan scope; manual form: `/test-coverage`.
- Step 24: `/test-coverage` cannot carry plan scope; manual form: `/test-coverage`.
- Step 25: `/test-coverage` cannot carry plan scope; manual form: `/test-coverage`.
- Step 26: `/code-review` cannot carry plan scope; manual form: `/code-review`.

```text
/orch-change-feature "[Plan: docs/implementation-plan.md#step-3] Upgrade the integration engine to a supported stable revision in silly-browser; Acceptance: Record the current stable commit, original-file hashes and an ordered applicable patch series.; The actual stable binary passes the handshake, identity and driver gates.; Support manifests distinguish qualified releases from historical or planned revisions.; Out of scope: Advertising an untested range of Chromium versions."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-4] Implement native graphics, font and screen diagnostics in silly-browser; Acceptance: Reports capture native graphics, font and display observations in both display modes.; Main-page, worker and rendering observations are checked for contradictions where their APIs are available.; Unavailable hardware features are recorded explicitly and native defaults remain reproducible.; Out of scope: Claiming that changing web identity emulates another operating system or its hardware."
/plan "[Plan: docs/implementation-plan.md#step-5] Design coherent rendering and profile policies in silly-browser; Acceptance: Document native behavior, opt-in policy behavior and supported combinations.; Specify fixture expectations and per-profile consistency across frames and workers.; Identify unsupported cross-platform combinations and the rollback switch for each policy.; Out of scope: Inventing unrelated GPU, fonts and screen values independently."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-6] Implement the first canvas and geometry policy in silly-browser; Acceptance: Native-mode fixtures retain their expected behavior.; The selected policy has deterministic profile behavior and documented frame/worker consistency.; A compiled binary passes rendering/export fixtures and records affected capabilities.; Out of scope: Additional rendering families before this policy has browser evidence."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-7] Implement the audio privacy policy in silly-browser; Acceptance: Offline and real-time audio fixtures complete without corruption or crashes.; The experimental policy is consistent within a profile and keeps changes within documented bounds.; Native-mode regression checks pass on the compiled engine."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-8] Implement measured font and display consistency improvements in silly-browser; Acceptance: Actual font rendering and permitted enumeration are validated against the host environment.; Viewport, outer-window geometry, scaling and multiple-display cases have repeatable fixture results.; Native GPU values and native fallback behavior remain intact in both display modes."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-9] Implement native authenticated HTTP proxy handling in silly-browser; Acceptance: HTTP requests and HTTPS CONNECT succeed through an authenticated fixture.; Encoded credentials, rejected authentication, timeouts and browser/request-client scope are tested.; Proxy credentials never enter public reports or command-line diagnostics."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-10] Implement authenticated SOCKS5 transport in silly-browser; Acceptance: Authenticated SOCKS5 traffic and remote DNS pass controlled end-to-end fixtures.; IPv4, IPv6, denied authentication and timeouts have deterministic outcomes.; Python and JavaScript launch variants select the same engine capability and redact secrets."
/plan "[Plan: docs/implementation-plan.md#step-11] Design SOCKS5 UDP and QUIC transport in silly-browser; Acceptance: An architecture decision describes UDP association, QUIC integration and routing evidence.; A controlled UDP/HTTP3 fixture and required network captures are specified.; Unsupported routes and safe fallback behavior are explicit."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-12] Implement the approved UDP and HTTP3 transport design in silly-browser; Acceptance: UDP ASSOCIATE and HTTP3 have end-to-end routing evidence through the configured proxy.; Association teardown, timeout, datagram limits and fallback fixtures pass.; Capabilities report unsupported proxy/server combinations truthfully."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-13] Implement WebRTC privacy and routing controls in silly-browser; Acceptance: ICE/STUN/TURN and IPv4/IPv6 fixtures record candidate exposure and actual routes.; Configured proxy/privacy policies fail clearly when a required route is unavailable.; Native mode and real peer connectivity have regression coverage."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-14] Implement explicit network exposure policies in silly-browser; Acceptance: Controlled HTTP/cache fixtures record the configured policy behavior.; Connection reuse, redirects, TLS and diagnostics remain functional.; Native behavior, experimental policies and routing limitations are documented and verified.; Out of scope: Fabricating successful network routes or treating zero timings as proof of correctness."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-15] Implement input scheduling and actionability coverage in silly-browser; Acceptance: Visible/enabled/stable and hit-target checks work across nested frames.; Per-call human_config, cancellation and timeout behavior are consistent in both languages.; Supported raw CDP/driver operations have fixture evidence and unsupported methods are listed.; Out of scope: Guaranteeing that paced input passes behavioral detection or CAPTCHA scoring."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-16] Implement SDK launch and lifecycle parity in silly-browser; Acceptance: A versioned API matrix records return types, options and lifecycle guarantees.; Both languages and the Puppeteer adapter pass ownership, cleanup, cancellation and option-precedence fixtures.; Reviewed reference coverage and remaining gaps are updated without claiming a comprehensive proprietary engine audit."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-17] Implement opt-in GeoIP, timezone and locale resolution in silly-browser; Acceptance: Proxy-route resolution and bounded failure behavior pass local/mock provider fixtures.; Explicit values override inferred timezone/locale consistently in Python and JavaScript.; Lookup reuse, cache boundaries and worker/context behavior are documented and tested."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-18] Implement real extension and persistent-profile qualification in silly-browser; Acceptance: An extension content script and background worker execute on the custom binary.; Cookies, localStorage and seeds survive close/relaunch in supported APIs.; Temporary cleanup, profile conflicts and corruption/crash recovery have reproducible outcomes."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-19] Implement an AI-friendly control adapter in silly-browser; Acceptance: An agent can inspect a local fixture, choose an element, act and read the result through the documented interface.; Control binding/access rules and cancellation are validated.; Errors are structured and screenshots/DOM observations have bounded collection behavior."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-20] Implement Linux platform qualification in silly-browser; Acceptance: The declared Linux binary compiles from a pinned revision with the sandbox enabled.; Required native and implemented feature fixtures pass or have explicit unsupported statuses.; A versioned platform report includes binary hash, libraries and host prerequisites."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-21] Implement macOS platform qualification in silly-browser; Acceptance: A native macOS builder produces the declared architecture binary from pinned source.; Native graphics/fonts, driver paths and implemented feature fixtures have measured outcomes.; Signing/notarization prerequisites and unsupported architectures are recorded."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-22] Implement the qualified multi-version release matrix in silly-browser; Acceptance: Every advertised tuple has source revision, patch hashes, binary hash and feature/driver results.; Rebase and regression procedures are reproducible for each maintained line.; Security update deadlines and removal of obsolete release lines are documented."
/orch-add-feature "[Plan: docs/implementation-plan.md#step-23] Implement verified packaging and distribution in silly-browser; Acceptance: Manifest signatures, archive hashes, requested version binding and safe extraction are enforced.; Packages preserve required notices and record OS signing/notarization status.; Tampering and wrong-version/wrong-platform fixtures fail before launch.; Out of scope: Publishing release binaries before their declared qualification gates pass."
```
