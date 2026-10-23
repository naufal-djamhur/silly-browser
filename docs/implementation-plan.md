# silly-browser implementation plan

**24 October native checkpoint:** [patch seven](cdp-timezone-validation-155.md) fixes CDP timezone validation/state and passes four strict default/native × headed/headless cases, 106 Node checks, five Python checks and ten driver routes on a separate Windows x64 155.0.8059.80 candidate. Preserve all older runtimes; distribution/MVP gates remain unfinished. A [subsequent public diagnostic rerun](detector-results-155-patch7.md) fails Fingerprint Scan and CreepJS criteria in both modes, with four complete observations.

Dated 14 October 2026, Asia/Jakarta. Repository: https://github.com/naufal-djamhur/silly-browser

This document is a resumable engineering plan, not an automatic execution schedule. The current native checkpoint above supersedes the original pre-build status: a separate seven-patch Windows 155 candidate is compiled and locally tested. Distribution and later feature iterations remain unfinished. See the [session handoff](session-handoff.md) for current evidence and continuation boundaries; [iteration 3](iteration-03.md) preserves the earlier checkpoint.

## Checkpoint and first action

- Source: Chromium 146.0.7680.177, with two applied C++ patches. The Windows x64 custom integration binary is built; seed infrastructure and the desktop web identity family have local browser evidence. See [validation summary](engine-validation-summary.json).
- Six JavaScript SDK tests, five Python SDK tests and ten stock-Chrome Windows driver smoke checks have passed. Separately, ten custom-engine driver checks, 28 JavaScript engine checks and five Python custom-engine checks pass. These are integration results, not a production release.
- The public SDK review inventories 103 files with selected-section review of 17. Proprietary reference engine patches are unavailable.
- On resume, inspect the ignored local `docs/native-build-status.json`, the end of `docs/native-build.log`, the actual compiler processes, the output binary and `artifacts/compatibility/custom-windows-146/results.json`. A stage timestamp is not live progress; an executable left by a failed run is not a validated release.
- If compilation is active, leave that checkout and build invocation alone. If failed, use step 1. If the whole pipeline succeeded, verify its evidence before completing steps 1 and 2. Never launch a duplicate build merely because the previous chat ended.
- Planned stable targets are historical snapshots. Verify the current official stable revision when beginning step 3; do not assume the October pin remains current.

## Iteration method and completion rules

Use one iteration per step, splitting it further when a distinct policy or transport path needs its own evidence. Each iteration records: starting commit and binary; hypothesis or requirement; minimal source/API change; local fixture; relevant native-mode regression checks; compiled binary results; remaining risks; final commit and next step. An iteration may span several sessions.

Keep a new C++ patch ordered and individually reversible. Record original source hashes, switches, process/context scope and supported platforms. Verify patch application, compile incrementally, exercise the relevant fixture and then run only affected driver/regression checks. If a new cross-family interaction fails, repair it before layering another policy onto it. Preserve the failing evidence and use the last qualified binary as the comparison point.

Status vocabulary: planned -> in-progress -> source-written -> compiled -> browser-validated -> release-qualified. Use failed/blocked with the concrete error or missing environment when necessary. Tests must measure the requested behavior; passing configuration mocks, patch application or a raw screenshot is not browser validation.

Native defaults remain the baseline. Platform web identity does not emulate a different OS, font inventory or hardware stack. Support claims describe exact qualified version/platform/architecture tuples. Profile, transport and input capabilities should fail explicitly when unavailable. Patch quantity is bookkeeping, not the release goal.

At every session boundary, update `docs/session-handoff.md` with current step/status, exact commits, results and ignored local evidence locations, first unresolved error, next action and whether any build is active. Public handoff notes exclude credentials, usernames, local paths and raw captures. Keep private machine-specific instructions in the workspace handoff file.

## Roadmap and dependencies

| Iterations | Outcome | Dependency / release meaning |
|---|---|---|
| 1-2 | First custom integration binary and measured driver/identity behavior | Initial checkpoint; no production release |
| 3-5 | Supported stable base, native observations and explicit rendering design | Foundation for source policy work |
| 6-8 | Individually qualified rendering families | Native fallback and cross-surface evidence required |
| 9-14 | Authenticated transport and explicit privacy/routing controls | UDP/QUIC follows a separate design decision |
| 15-19 | Input/API coverage, GeoIP, extensions/profiles and agent adapter | No automatic behavioral-detector pass claim |
| 20-23 | Actual platform builds, exact release matrix and verified distribution | Depends on access to native builders and signing prerequisites |
| 24-26 | Expanded integrations, measurements and release evidence review | Required gates determine what may be advertised |

Dependencies below are explicit, not a promise that all numerical steps must run in strict order. Network and SDK work may become ready independently after the stable foundation. Do not modify the active checkout while the current compile is running.

<a id="step-1"></a>

## Step 1 — Complete or repair the first native compilation

**Iteration:** 1 · **Status:** integration-validated · **Depends on:** none · **Tracker:** BUILD-01

Observe the existing Windows Chromium 146 pipeline. If it failed, preserve the first actionable diagnostic, correct only that failure, verify the patched checkout and resume incrementally. A later session must inspect the actual process and log before starting another build.

**Acceptance:**

- The compiler and final link complete, and the executable reports its actual version and SHA256.
- The two-patch checkout verification and engine handshake succeed.
- Save build outcome and remaining failures without marking unimplemented features complete.

**Out of scope:** Further engine changes while the existing compilation is active.

<a id="step-2"></a>

## Step 2 — Test the current custom engine and driver paths

**Iteration:** 2 · **Status:** integration-validated · **Depends on:** 1 · **Tracker:** ENGINE-02, DRIVER-17

Inspect the automatic ten-case driver report and identity test after compilation. Extend validation where the existing test is incomplete: native identity, all explicit platform presets, high-entropy Client Hints, frames, workers and invalid options. Repeat only missing or failed checks.

**Acceptance:**

- All ten custom-engine driver smoke checks have recorded outcomes in both display modes.
- UA and Client Hints, including platformVersion, agree on HTTP, document, frame and worker surfaces; native defaults are preserved.
- The seed handshake, persistent lifecycle and invalid-option behavior have actual browser evidence.

<a id="step-3"></a>

## Step 3 — Upgrade the integration engine to a supported stable revision

**Iteration:** 3 · **Status:** planned · **Depends on:** 2 · **Tracker:** BUILD-01, RELEASE-18

Verify the current stable revision from official Chromium release data when this iteration begins. Rebase the existing ordered patches onto that exact commit in a separate checkout; keep the historical 146 evidence as an integration record.

**Acceptance:**

- Record the current stable commit, original-file hashes and an ordered applicable patch series.
- The actual stable binary passes the handshake, identity and driver gates.
- Support manifests distinguish qualified releases from historical or planned revisions.

**Out of scope:** Advertising an untested range of Chromium versions.

<a id="step-4"></a>

## Step 4 — Implement native graphics, font and screen diagnostics

**Iteration:** 4 · **Status:** planned · **Depends on:** 3 · **Tracker:** ENGINE-03, ENGINE-04, ENGINE-07

Create a local diagnostic fixture and reproducible report for native GPU passthrough, WebGL/WebGPU availability, installed fonts, rendering, display scaling and window geometry. Record headed/headless differences and profile capabilities.

**Acceptance:**

- Reports capture native graphics, font and display observations in both display modes.
- Main-page, worker and rendering observations are checked for contradictions where their APIs are available.
- Unavailable hardware features are recorded explicitly and native defaults remain reproducible.

**Out of scope:** Claiming that changing web identity emulates another operating system or its hardware.

<a id="step-5"></a>

## Step 5 — Design coherent rendering and profile policies

**Iteration:** 5 · **Status:** planned · **Depends on:** 4 · **Tracker:** ENGINE-02 through ENGINE-07

Write an architecture decision for explicit native and experimental privacy policies, persistent profile seed semantics and supported surface relationships. Choose an initial rendering family from the measured diagnostics before introducing source changes.

**Acceptance:**

- Document native behavior, opt-in policy behavior and supported combinations.
- Specify fixture expectations and per-profile consistency across frames and workers.
- Identify unsupported cross-platform combinations and the rollback switch for each policy.

**Out of scope:** Inventing unrelated GPU, fonts and screen values independently.

<a id="step-6"></a>

## Step 6 — Implement the first canvas and geometry policy

**Iteration:** 6 · **Status:** planned · **Depends on:** 5 · **Tracker:** ENGINE-05

Introduce one bounded opt-in source policy from the rendering decision, preserving the native path. Cover its applicable canvas, OffscreenCanvas, export and geometry surfaces before adding another rendering family.

**Acceptance:**

- Native-mode fixtures retain their expected behavior.
- The selected policy has deterministic profile behavior and documented frame/worker consistency.
- A compiled binary passes rendering/export fixtures and records affected capabilities.

**Out of scope:** Additional rendering families before this policy has browser evidence.

<a id="step-7"></a>

## Step 7 — Implement the audio privacy policy

**Iteration:** 7 · **Status:** planned · **Depends on:** 6 · **Tracker:** ENGINE-06

Add the explicitly designed opt-in audio policy and its native fallback. Validate offline and real-time behavior, numerical bounds, repeated profile behavior and worker availability where applicable.

**Acceptance:**

- Offline and real-time audio fixtures complete without corruption or crashes.
- The experimental policy is consistent within a profile and keeps changes within documented bounds.
- Native-mode regression checks pass on the compiled engine.

<a id="step-8"></a>

## Step 8 — Implement measured font and display consistency improvements

**Iteration:** 8 · **Status:** planned · **Depends on:** 7 · **Tracker:** ENGINE-04, ENGINE-07

Address contradictions demonstrated by the diagnostics with narrowly scoped font/display policies. Preserve real Windows GPU passthrough and disclose host font availability; web identity presets alone do not create a foreign graphics stack.

**Acceptance:**

- Actual font rendering and permitted enumeration are validated against the host environment.
- Viewport, outer-window geometry, scaling and multiple-display cases have repeatable fixture results.
- Native GPU values and native fallback behavior remain intact in both display modes.

<a id="step-9"></a>

## Step 9 — Implement native authenticated HTTP proxy handling

**Iteration:** 9 · **Status:** planned · **Depends on:** 3 · **Tracker:** NET-09

Implement engine-level parsing and authentication for configured HTTP proxies with inline credentials, independently of SDK-only Playwright authentication. Use a controlled proxy fixture and redact credentials from diagnostics.

**Acceptance:**

- HTTP requests and HTTPS CONNECT succeed through an authenticated fixture.
- Encoded credentials, rejected authentication, timeouts and browser/request-client scope are tested.
- Proxy credentials never enter public reports or command-line diagnostics.

<a id="step-10"></a>

## Step 10 — Implement authenticated SOCKS5 transport

**Iteration:** 10 · **Status:** planned · **Depends on:** 9 · **Tracker:** NET-10

Add native SOCKS5 username/password support with explicit remote DNS, address-family and failure semantics. Both SDK languages should expose the same supported transport contract.

**Acceptance:**

- Authenticated SOCKS5 traffic and remote DNS pass controlled end-to-end fixtures.
- IPv4, IPv6, denied authentication and timeouts have deterministic outcomes.
- Python and JavaScript launch variants select the same engine capability and redact secrets.

<a id="step-11"></a>

## Step 11 — Design SOCKS5 UDP and QUIC transport

**Iteration:** 11 · **Status:** planned · **Depends on:** 10 · **Tracker:** NET-11

Produce a transport design and feasibility result for UDP ASSOCIATE and QUIC/HTTP3. Specify routing, connection lifetime, datagram limits and fallback behavior before implementing a new transport path.

**Acceptance:**

- An architecture decision describes UDP association, QUIC integration and routing evidence.
- A controlled UDP/HTTP3 fixture and required network captures are specified.
- Unsupported routes and safe fallback behavior are explicit.

<a id="step-12"></a>

## Step 12 — Implement the approved UDP and HTTP3 transport design

**Iteration:** 12 · **Status:** planned · **Depends on:** 11 · **Tracker:** NET-11

Implement only the transport design established in the preceding decision, using a controlled SOCKS5 server and HTTP3 origin. A feasibility result may narrow advertised support; it must not silently relabel direct traffic as tunneled.

**Acceptance:**

- UDP ASSOCIATE and HTTP3 have end-to-end routing evidence through the configured proxy.
- Association teardown, timeout, datagram limits and fallback fixtures pass.
- Capabilities report unsupported proxy/server combinations truthfully.

<a id="step-13"></a>

## Step 13 — Implement WebRTC privacy and routing controls

**Iteration:** 13 · **Status:** planned · **Depends on:** 10 · **Tracker:** ENGINE-08

Add explicit WebRTC privacy/routing policies and evaluate the requested proxy-exit-IP option against actual connectivity. Report candidate exposure and enforce documented routing instead of implying that a displayed address proves the media path.

**Acceptance:**

- ICE/STUN/TURN and IPv4/IPv6 fixtures record candidate exposure and actual routes.
- Configured proxy/privacy policies fail clearly when a required route is unavailable.
- Native mode and real peer connectivity have regression coverage.

<a id="step-14"></a>

## Step 14 — Implement explicit network exposure policies

**Iteration:** 14 · **Status:** planned · **Depends on:** 9, 10, 13 · **Tracker:** NET-12

Specify and implement justified privacy controls for proxy-related headers, cache metadata and timing exposure. Validate protocol correctness against native Chromium; document observable tradeoffs and request-client scope.

**Acceptance:**

- Controlled HTTP/cache fixtures record the configured policy behavior.
- Connection reuse, redirects, TLS and diagnostics remain functional.
- Native behavior, experimental policies and routing limitations are documented and verified.

**Out of scope:** Fabricating successful network routes or treating zero timings as proof of correctness.

<a id="step-15"></a>

## Step 15 — Implement input scheduling and actionability coverage

**Iteration:** 15 · **Status:** planned · **Depends on:** 3 · **Tracker:** INPUT-13

Complete configurable mouse, keyboard and scroll scheduling for documented SDK methods. Define how raw CDP and other drivers participate, and add engine hooks only when that contract requires them. Cover frames, hit targets, deadlines and cancellation.

**Acceptance:**

- Visible/enabled/stable and hit-target checks work across nested frames.
- Per-call human_config, cancellation and timeout behavior are consistent in both languages.
- Supported raw CDP/driver operations have fixture evidence and unsupported methods are listed.

**Out of scope:** Guaranteeing that paced input passes behavioral detection or CAPTCHA scoring.

<a id="step-16"></a>

## Step 16 — Implement SDK launch and lifecycle parity

**Iteration:** 16 · **Status:** planned · **Depends on:** 2, 15 · **Tracker:** SDK-16

Complete the public Python sync/async and JavaScript API contract, including a real Puppeteer launch adapter, composable launch options, humanizeBrowser behavior, argument precedence and typed capability errors. Extend the scoped public SDK review as each API is implemented.

**Acceptance:**

- A versioned API matrix records return types, options and lifecycle guarantees.
- Both languages and the Puppeteer adapter pass ownership, cleanup, cancellation and option-precedence fixtures.
- Reviewed reference coverage and remaining gaps are updated without claiming a comprehensive proprietary engine audit.

<a id="step-17"></a>

## Step 17 — Implement opt-in GeoIP, timezone and locale resolution

**Iteration:** 17 · **Status:** planned · **Depends on:** 10, 16 · **Tracker:** SDK-14

Resolve GeoIP through the configured route with deadlines, explicit override precedence and cache behavior. Reuse a single approved lookup for timezone/locale and any exit-address consumer, and define context versus engine scope.

**Acceptance:**

- Proxy-route resolution and bounded failure behavior pass local/mock provider fixtures.
- Explicit values override inferred timezone/locale consistently in Python and JavaScript.
- Lookup reuse, cache boundaries and worker/context behavior are documented and tested.

<a id="step-18"></a>

## Step 18 — Implement real extension and persistent-profile qualification

**Iteration:** 18 · **Status:** planned · **Depends on:** 16 · **Tracker:** SDK-15

Finish extension_paths across supported launch variants and validate a real extension, rather than only inspecting launch arguments. Qualify persistent storage, seed preservation, profile locking and crash recovery.

**Acceptance:**

- An extension content script and background worker execute on the custom binary.
- Cookies, localStorage and seeds survive close/relaunch in supported APIs.
- Temporary cleanup, profile conflicts and corruption/crash recovery have reproducible outcomes.

<a id="step-19"></a>

## Step 19 — Implement an AI-friendly control adapter

**Iteration:** 19 · **Status:** planned · **Depends on:** 16 · **Tracker:** additional AI scope

Add a documented local agent/MCP-style adapter over the supported browser operations, using explicit targets, structured observations and cancellation. Keep the control connection local by default and define access restrictions.

**Acceptance:**

- An agent can inspect a local fixture, choose an element, act and read the result through the documented interface.
- Control binding/access rules and cancellation are validated.
- Errors are structured and screenshots/DOM observations have bounded collection behavior.

<a id="step-20"></a>

## Step 20 — Implement Linux platform qualification

**Iteration:** 20 · **Status:** planned · **Depends on:** 3, 4, 16 · **Tracker:** PLATFORM-21

Create a reproducible Linux source/patch and qualification workflow for a declared architecture. Repeat native graphics/font observations, identity, drivers and implemented feature fixtures on an actual Linux binary.

**Acceptance:**

- The declared Linux binary compiles from a pinned revision with the sandbox enabled.
- Required native and implemented feature fixtures pass or have explicit unsupported statuses.
- A versioned platform report includes binary hash, libraries and host prerequisites.

<a id="step-21"></a>

## Step 21 — Implement macOS platform qualification

**Iteration:** 21 · **Status:** planned · **Depends on:** 3, 4, 16 · **Tracker:** PLATFORM-21

Create a native macOS qualification workflow with declared architectures, platform toolchain and signing requirements. Windows web identity presets do not count as macOS execution evidence.

**Acceptance:**

- A native macOS builder produces the declared architecture binary from pinned source.
- Native graphics/fonts, driver paths and implemented feature fixtures have measured outcomes.
- Signing/notarization prerequisites and unsupported architectures are recorded.

<a id="step-22"></a>

## Step 22 — Implement the qualified multi-version release matrix

**Iteration:** 22 · **Status:** planned · **Depends on:** 3; 20/21 only for declared Linux/macOS support · **Tracker:** RELEASE-18

Maintain separate ordered patch series, capability manifests and regression evidence for each supported exact Chromium release/platform/architecture. Include security-update and retirement policy; planned revisions remain unadvertised.

**Acceptance:**

- Every advertised tuple has source revision, patch hashes, binary hash and feature/driver results.
- Rebase and regression procedures are reproducible for each maintained line.
- Security update deadlines and removal of obsolete release lines are documented.

<a id="step-23"></a>

## Step 23 — Implement verified packaging and distribution

**Iteration:** 23 · **Status:** planned · **Depends on:** 22 · **Tracker:** RELEASE-19

Add release packaging and a downloader that binds version/platform/architecture to verified archive contents. Separate build reproducibility, archive signatures and OS code signing, and preserve Chromium/component license notices.

**Acceptance:**

- Manifest signatures, archive hashes, requested version binding and safe extraction are enforced.
- Packages preserve required notices and record OS signing/notarization status.
- Tampering and wrong-version/wrong-platform fixtures fail before launch.

**Out of scope:** Publishing release binaries before their declared qualification gates pass.

<a id="step-24"></a>

## Step 24 — Test expanded drivers and reference integrations

**Iteration:** 24 · **Status:** planned · **Depends on:** 16, 18, 22 · **Tracker:** DRIVER-17, SDK-16

Expand actual-binary compatibility beyond the ten smoke checks. Exercise pinned public reference examples that apply to the project, including undetected-chromedriver, and record environmental/dependency blockers without marking them passed.

**Acceptance:**

- Declared driver/version/platform tuples have measured results for downloads, uploads, dialogs, permissions, reconnect and lifecycle.
- Every inventoried reference example has executed, unsupported or blocked status with a reason.
- A failing supported tuple blocks its release qualification.

<a id="step-25"></a>

## Step 25 — Test repeated benchmark and performance outcomes

**Iteration:** 25 · **Status:** planned · **Depends on:** 6, 7, 8, 12, 13, 14, 15, 24 · **Tracker:** QA-20, PERF-22

Run repeatable correctness/privacy measurements and the listed public demo probes where permitted, separating missing data from numerical scores. Compare stock and custom binaries under matched conditions and measure resource use and concurrency.

**Acceptance:**

- Reports record exact binary/library versions, profiles, environment, repetitions and unavailable results.
- Startup latency, idle/per-page CPU/RAM and concurrent cleanup/crash behavior have measured budgets.
- Public score observations are separated from local correctness and carry no universal pass or guaranteed CAPTCHA claim.

**Out of scope:** Automated challenge solving or optimizing against private third-party defenses.

<a id="step-26"></a>

## Step 26 — Review evidence and update release documentation

**Iteration:** 26 · **Status:** planned · **Depends on:** 23, 24, 25 · **Tracker:** all completion gates

Review the final implementation and evidence, reconcile README/API/support manifests, and publish an accurate release checklist and changelog. An unresolved required gate keeps the corresponding feature or release experimental.

**Acceptance:**

- Every required tracker gate links to actual evidence or remains explicitly incomplete.
- README, SDK reference, release notes and capabilities agree with the qualified binaries.
- No unsupported feature, broad version range or comparative superiority is advertised.
