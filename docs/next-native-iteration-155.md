# Next native iteration: browser API correctness across layers

**N8-1 through N8-4 and P1 complete — 24 October 2026, Asia/Jakarta.** [N8 evidence](cdp-lifecycle-155.md) records CB-0008; [P1 evidence](geometry-media-155.md) records the DPR-only invalidation defect, independent CB-0009 and separate qualified candidate. Original planning snapshots below remain historical; the current source/candidate count is nine and P2 is the next planned family.

The objective is to use the requested diagnostics to identify reproducible inconsistencies between Chromium, CDP, browser APIs and SDK configuration, then repair the responsible layer. Each engine change needs a failing owned fixture and a stated API contract. A positive detector flag alone does not establish that an API is broken.

## Starting point

- Repository checkpoint: `86dfa41803d780d638e487573ff786576a9add71`.
- Native source: Chromium **155.0.8059.80**, revision `43a195105613ac83c21d3f14de279f4a045c7da0`, **seven** release-specific patches.
- Candidate: `work/qualified/155-cdp-timezone-20261024/`; DLL SHA256 `4791896fcfe854ffd50d14cf88f51857967b8159995ba346f61b5a14183de526`.
- Preserved upstream-source control: the separate unpatched **155.0.8059.80** local build. It shares unchanged build artifacts and is not an official distribution or clean full build.
- Existing gates: four strict CDP timezone cases, 106 Node checks including stock controls, five Python checks and ten driver routes pass. The full Blink/content_shell test harness remains unrun.
- Latest external observations: Fingerprint Scan **100/100** in both modes; CreepJS headless **33% headed / 100% headless**, like-headless **31% / 38%**, stealth **0% / 0%**. Four complete observations, four criterion failures, no collection errors. See [the exact check tables](detector-results-155-patch7.md) and [hash-bound summary](detector-results-155-patch7-summary.json).

At planning time no additional native defect was established. Execution subsequently reproduced malformed timezone acquisition/update acceptance and implemented CB-0008. Patch seven remains the preserved baseline; P1 subsequently added the qualified CB-0009; the current source/candidate count is nine.

## What the references establish

[Fingerprint Scan's documentation](https://fingerprint-scan.com/docs) describes observations spanning browser identity, execution contexts, APIs, rendering, locale, display and network. It distinguishes inconsistencies from direct automation indicators and withholds some internal detection details. Its public result supports measurement, not complete recovery of its scoring rules.

[CreepJS](https://github.com/abrahamjuliot/creepjs) documents API, rendering and privacy observations. Its published code and captured values help identify which behavior to test independently. The browser's required behavior still comes from the applicable web/API contract, explicit configuration and upstream implementation.

## Check-to-layer triage

| Observed area | Current evidence | Responsible layer / next work | Native patch decision |
| --- | --- | --- | --- |
| `webDriverIsOn`, `webdriver`, writable descriptor observation | Active automation is exposed; stock 155 reports the same selected observations | WebDriver/API conformance; retain truthful automation state and test its documented lifecycle | No defect established; no status-hiding change scheduled |
| `hasHeadlessUA`, `hasHeadlessWorkerUA` | Headless mode is identified in both page and worker; headed mode has neither flag | Native identity routing and worker configuration; test agreement where the contract requires it | Repair an actual routing/version inconsistency if reproduced; no mode-label concealment scheduled |
| CDP checks, stack observation, automation-key detection | Positive observations under Playwright; the newly captured public object adds iframe/worker details | Protocol lifecycle/error handling and client ownership; independently test page correctness and side effects before alleging a defect | No change to erase diagnostic artifacts; ordinary invalid-state, crash or protocol defects are eligible |
| `noTaskbar`, `hasVvpScreenRes` | Configured 1920×1080 context has no available-screen gap; earlier native-window controls match stock | Browser display/viewport configuration and Windows geometry; distinguish virtual screens from physical displays | Patch only invalid geometry/DPI/resize behavior against an explicit contract |
| `prefersLightColor` | Light preference was selected in both modes | Explicit context/browser color-scheme configuration | A supported preference is not a malfunction |
| `noContentIndex`, `noContactsManager`, `noDownlinkMax` | The selected API absences also occur in stock 155 and the saved reference | Platform/version/secure-context/permission support matrix and capability reporting | No placeholder API or fabricated value; a complete new API is a separately scoped feature |
| Timezone/locale | CB-0007 fixes invalid-update state corruption; basic navigation/reset/context gates pass | Blink timezone controller, inspector emulation lifecycle and native defaults | Completed by N8, including CB-0008; next family is geometry/media-query coverage |
| Fonts, canvas/text, WebGL/GPU | Basic functional fixtures pass; CreepJS `hasBadWebGL=false`; broad rendering/fallback coverage remains incomplete | Native font/rendering paths and actual graphics backend | Add contract coverage first; fix confirmed rendering defects while preserving actual capabilities |
| Network/WebRTC | Fingerprint Scan network reason is +49/+50 despite no configured proxy; cause is not established by the public reasons | Owned transport, timing and configured WebRTC-policy fixtures | No native patch based only on category points; do not fabricate timing, headers or network identity |

## Coverage catalog beyond the current positive flags

The public references cover more than the current headless group. The following is a coverage plan for the browser's behavior, not a claim that every listed surface failed. Existing tests already exercise simple layout, Ahem/Noto loading, canvas/worker readback, WebGL readback, offline audio gain, storage, navigation and input. Extend the uncovered contracts rather than rebuilding those same smoke tests.

| Family | Existing evidence / qualification gap | Next owned contract | Component to investigate only after a failure |
| --- | --- | --- | --- |
| Frames and object relationships | Basic frame/input and document/worker observations pass; origin transitions are not comprehensive | Same-origin and cross-origin frame access, frame replacement, detached objects and correct exceptions | Blink frame/window bindings or SDK target lifecycle |
| Styles, DOM/SVG and geometry | Simple transformed rectangles pass; SVG, dynamic styles and broader layout are unqualified | Controlled CSS mutations, SVG bounds/transforms, layout invalidation and DOMRect relationships | Blink style, layout and SVG implementations |
| Numeric runtime and errors | Three invalid web-API calls have controls; broad numeric/runtime coverage is unqualified | Selected standards fixtures for numeric edge cases and exception type/side effects; allow version-specific message text | V8 or the API implementation, according to the actual failing contract |
| Text, emoji, font fallback and metrics | Ten Noto faces and Ahem metrics pass for the existing samples | Licensed-font shaping and fallback, missing glyphs, supported-script text and equivalent document/worker canvas operations | Blink text/fonts, DirectWrite integration or Skia |
| Canvas export and worker rendering | Basic 2D/OffscreenCanvas pixels pass; export/transfer lifecycle is incomplete | Pixels, Blob export/decode, transfer lifecycle and context reset under explicit color-space/alpha settings | Blink canvas/OffscreenCanvas and Skia |
| Graphics capabilities and lifecycle | Simple WebGL readback passes; no complete WebGL2/WebGPU qualification | Actual supported formats/limits, error semantics, context loss/restoration and deterministic readback where supported | Blink graphics APIs, ANGLE, Dawn or GPU service |
| Audio and media | Offline gain passes; broader rendering, media support and permission lifetimes are unqualified | Owned offline graphs with numerical tolerances, lifecycle errors, and small owned media fixtures against reported support | Blink Web Audio, media/decoder paths or permissions |
| MIME support and speech | No new defect reproduced; extension/plugin and voice inventory are platform dependent | Report actual supported MIME/media behavior and asynchronous voice enumeration; tolerate legitimate host differences | Browser capability plumbing, media or speech platform integration |
| Display and media preferences | Configured/native-screen behavior matched stock in earlier controls | Native window/viewport transitions, DPR and media-query change events under explicit settings | Display/window integration, Blink geometry or CDP emulation |
| Locale and timezone | CB-0007 and core propagation pass; additional target ownership cases are missing | N8 lifecycle cases, Date/Intl agreement and appropriately scoped defaults | Blink timezone/locale handling and inspector state |
| Storage, permissions and profile lifecycle | Basic localStorage/IndexedDB and profile tests pass; broad permission/origin coverage is incomplete | Origin isolation, denied/granted permission behavior, persistent/temporary lifecycle and cleanup | Content permissions/storage, profile management or SDK ownership |
| WebAssembly and feature availability | No dedicated expanded contract in this iteration | An owned valid/invalid module, expected API failure behavior and truthful capability reporting | V8 or build/runtime feature configuration |
| HTTP and execution-context identity | Existing native/preset document/header/worker tests pass within their declared scope | Preserve native defaults; verify configured values are routed only to their supported surfaces | Native identity configuration, header routing or SDK option forwarding |
| Network, proxy and WebRTC | Owned HTTP proxy/CONNECT and local STUN policy cases pass; IPv6/TURN and wider routing remain unqualified | Explicit routing/failure contracts, credential boundaries and standard timing semantics | Net stack, Network Service or WebRTC policy integration |

For every family, record platform support, secure-context and permission requirements before expecting an API to exist. The current desktop identity presets change web identity; they do not implement another operating system's fonts, GPU stack or full API inventory. Do not label those documented scope limits as a newly discovered engine defect.

Both references can change. Freeze the source/reference version and collector hash used for each future measurement; publish observation-level results rather than treating a fingerprint hash as a correctness oracle. The ordinary Fingerprint Scan run does not establish that mouse or typing behavior was evaluated; input/actionability work remains a separately measured E2E capability.

## Execution order

### N8-1 — Define the additional contracts

**Status:** complete. **Depends on:** preserved patch-seven evidence. **Output:** [owned contract matrix](cdp-lifecycle-contracts-155.md).

Use the existing CDP probe and native environment tests as context. Record each new scenario's required behavior, affected target/process, expected error or state transition, and how the upstream control behaves. Mark behavior unspecified when documentation does not establish a requirement. Do not assert that page, dedicated worker, service worker and unrelated targets must share every value: their configuration scopes can differ.

The matrix must distinguish existing coverage from new coverage. Existing single invalid-update, canonical-alias, valid-only navigation, reset/detach and separate-context checks already pass; do not present them as missing work.

**Exit:** every proposed assertion has a contract and scope, or is explicitly observation-only. A diagnostic percentage is not an assertion of web-platform correctness.

### N8-2 — Expand the owned CDP lifecycle reproducer

**Status:** complete. **Depends on:** N8-1. Nine implemented scenarios include the eight planned cases and the new initial-malformed-ID control.

The owned loopback fixture is implemented in `tests/cdp-timezone-lifecycle-browser.test.mjs`; see runtime evidence. Test both headed and headless modes, with native defaults and explicit native locale/timezone where applicable. Record upstream-control and patch-seven results separately.

New cases to qualify:

1. Several rejected invalid updates interleaved with valid updates; verify the final effective and restored timezone.
2. Cross-site navigation **and return** after a rejected update, extending the existing one-way rejection/navigation observation.
3. Reload and document replacement after rejection; ensure the accepted state remains usable.
4. Detach immediately after a rejected update, without first navigating; verify restoration of the appropriate native baseline.
5. Close the emulated target, create a new target, and verify that temporary state does not outlive its documented ownership.
6. Persistent-profile relaunch: persisted browser storage remains, while temporary CDP state follows its documented lifetime. Use owned temporary profiles only.
7. Two CDP clients addressing a target: establish upstream ownership/conflict behavior and verify valid errors, cleanup and absence of corrupted state. Do not assume independent simultaneous global overrides are supported.
8. Worker creation/termination around configuration changes: verify explicit native defaults; treat target-specific CDP worker inheritance as observation-only until its contract is established.

Record the first failure, accepted/rejected responses, baseline/effective/restored values, navigation outcome, page errors and crashes. Preserve raw results in a fresh ignored artifact directory. Give the fixture a strict correctness exit status; distinguish an upstream bug, a custom regression and unspecified behavior.

**Exit:** each scenario is passed, failed with a minimal reproducer, or explicitly unqualified with a reason. If no defect reproduces, close this iteration as expanded coverage and retain seven patches.

### N8-3 — Implement the first confirmed native defect

**Status:** complete. **Depends on:** the reproduced embedded-NUL acquisition/update failure from N8-2. CB-0008 is locally qualified as documented.

Before editing, write the violated contract, exact trigger, expected versus observed result, regression/control result and minimal native cause. A shared upstream defect is eligible if it violates the established contract; matching upstream alone is not proof of correctness.

For a timezone validation/ownership defect, review the existing Blink timezone controller and inspector emulation agent identified in [the CDP review](native-cdp-review-155.md). Change the layer that owns the defective state. If the fault is option forwarding in the SDK or a WebDriver command translation, fix that layer instead of forcing an unrelated engine change. Test fixtures may use JavaScript to observe real APIs; runtime property overrides are not an engine fix.

Add the smallest meaningful regression. When available, add/run the relevant native Blink unit/protocol test; if the full harness cannot run, record that limitation and require the actual-browser owned regression. Track a justified C++ change as an independent release-specific CB-0008, including source hashes and accurate handshake count. Do not fold the separate legacy `engine/patches` candidates into this release.

**Exit:** the original owned reproducer is RED on the preserved baseline and GREEN on the candidate, with the native cause and supported scope documented. No unconditional patch eight is promised.

### N8-4 — Build and qualify a separate candidate

**Status:** complete. **Depends on:** N8-3. Separate candidate build and both-mode gates pass.

Inspect live processes first and preserve an active build. Verify the exact ordered patch series and pristine application. Reuse the verified toolchain and appropriate incremental build graph, but write the new runtime into a fresh candidate directory. Preserve the original five-patch output, patch-six/seven runtimes, stock control, reference and manual profiles. Do not restart the old full pipeline into a preserved runtime directory.

Run the new reproducer and affected native environment/context/worker tests first. After they pass, run the established browser regression group, five Python checks and ten driver routes once for the final candidate, in both modes where applicable. Do not double-count repeated stock-control checks as additional unique coverage. Record any unrun native harness, exact library/ChromeDriver versions, EXE/DLL hashes and changes to the supported scope.

**Exit:** no unresolved regression; source verification and runtime identity match the report. If the candidate fails, keep the last qualified runtime as the default and repair only the ready defect. External diagnostic reruns can record outcomes, but cannot substitute for these contract checks.

## Follow-up queue after the first ready iteration

These are ordered coverage investigations, not a claim that each needs a patch:

| Priority | Follow-up | Concrete owned checks | Fix gate |
| --- | --- | --- | --- |
| P1 — complete | [Native geometry and media queries](geometry-media-155.md) | Resize/window bounds, visual viewport, screen/available bounds and DPR relationships; configured versus native-window conditions; no silent system-DPI changes | Demonstrated incorrect geometry or propagation; preserve legitimate headed/headless differences |
| P2 | Font fallback and text rendering | Existing licensed Noto/Ahem pack plus supported-script shaping, missing-glyph fallback, document/worker canvas and permitted local font loading | Incorrect glyph/metric/fallback or permission behavior; no copied host-font identity |
| P3 | Graphics lifecycle | Deterministic pixel/readback fixtures, OffscreenCanvas, context loss/restoration and reported backend capability | Rendering/API failure under the actual backend; no fabricated GPU identity |
| P4 | Explicit network/privacy policies | Existing owned proxy fixtures plus separately specified IPv6/TURN/routing tests and truthful timing/error behavior | Violation of an explicit supported routing/privacy policy; category scores alone are insufficient |
| P5 | Owned extension execution | A local test extension's content script and background worker execute through supported launch paths in both modes | A concrete missing product capability or lifecycle defect; independent of detector classifications |

Select one ready item at a time. Add a new platform, dependency or policy as a separate iteration when it changes the qualification boundary.

Audio/media, frame-origin semantics, SVG/layout, storage/permissions and runtime/WebAssembly work from the catalog enter the queue after these items unless a concrete application failure makes one ready earlier. Reorder by evidence and dependency, then record the reason. These are future investigations; the next session should not implement every catalog entry at once.

## Evidence, acceptance and rollback

Each investigation produces a small dossier containing:

1. The requested API behavior, contract/reference and exact configuration scope.
2. Baseline identity: upstream revision, patch count, EXE/DLL hashes and library/driver versions.
3. A minimal owned fixture with its expected result or explicitly marked observational result.
4. Separate outcomes for patch seven and the upstream control, each in headed and headless modes. Include mode-specific expectations, tolerances and unsupported cases.
5. The cause classification: native defect, SDK/driver defect, test assumption, supported platform difference, environmental issue, or unresolved observation.
6. The smallest fix and regression if a defect is confirmed; otherwise a no-change finding with its evidence.
7. Candidate build/test outcome, remaining limitations, source checkpoint and next ready step.

An implementation is ready only when the owning layer and its contract are established. A native fix completes when the owned failing case passes on the compiled candidate, relevant existing checks pass, and the report binds them to the same binary. Shared upstream bugs still need this proof. API absence and a failing external score do not supply it by themselves.

Rollback means select the preserved last-qualified runtime and revert the independent candidate patch in the appropriate checkout. Do not delete or replace baseline runtimes, rewrite raw captures or reset unrelated work. Reverify the exact release series before resuming any build. Native compatibility, external diagnostic outcomes and release eligibility remain separately reported states.

## Dependency and completion review

| Work item | Dependency | Ready now? | Deliverable |
| --- | --- | --- | --- |
| N8-1 | Existing patch-seven evidence | Complete | Scoped contract matrix and coverage inventory |
| N8-2 | N8-1 | Complete | Owned lifecycle fixture and both-mode baseline/control report |
| N8-3 | Confirmed N8-2 contract defect | Complete | Minimal fix and regression; CB-0008 only for an actual native patch |
| N8-4 | N8-3 | Complete | Separate compiled candidate and final regression/driver evidence |
| Follow-up queue | N8 and P1 closed with qualified fixes | P2 planned | One independently scoped family investigation at a time |

Plan completion means this document has a source-bound starting point, check/layer mapping, coverage gaps, ordered tasks, dependencies, acceptance criteria, rollback and continuation instructions. It does not mean the proposed fixtures, fixes or builds have executed. No external score improvement or implementation duration is promised before the relevant defect and build scope are known.

## Verification and continuation

Existing commands, run from the repository with the appropriate source/candidate paths and a **fresh** output directory:

```powershell
python build/verify_applied_checkout.py PATH_TO_CHROMIUM_SRC --release 155.0.8059.80
node benchmarks/cdp_emulation_probe.mjs --engines PATH_TO_ENGINE_LIST.json --output NEW_REPORT_DIRECTORY --expect-fixed
```

Use `nativeEnvironment: true` in the owned CDP engine list to include the explicit-native-default cases. The implemented lifecycle command is `npm run test:cdp-lifecycle`, with `CUSTOM_CDP_LIFECYCLE_ENGINES` and a fresh `CUSTOM_CDP_LIFECYCLE_REPORT`; see the contract record. Existing browser/Python/driver commands and their report requirements are documented in [the patch-seven qualification](cdp-timezone-validation-155.md).

Every completed iteration records the contract, source diff or no-change conclusion, baseline/candidate evidence, modes tested, remaining limitations and source checkpoint. Update this plan and [the handoff](session-handoff.md). No detector pass, current CloakBrowser parity or production release is qualified by writing the plan.

**Next-session instruction:** N8 and P1 execution are complete. Preserve the nine-patch candidate, patches seven/eight and all controls. Read the geometry report/contracts and select a separately ready P2 font fallback/text investigation from the follow-up queue. Do not rerun a completed build or overwrite qualified runtimes merely because a new session starts.