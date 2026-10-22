# Native inspection coverage and acceptance criteria

Checkpoint: 22 October 2026. The selected free Windows CloakBrowser artifact is **146.0.7680.177**, identified by the hashes in the [inspection report](cloakbrowser-native-inspection.md). Silly-browser's active build is **155.0.8059.80**. Evidence about the former does not qualify the latter.

The investigation is **partial**. Four function dossiers, nine retained records and nine analyst-selected function seeds are evidence counts, not percentages of the product or its patches. The PE exception table's runtime-function records are also not a denominator for feature coverage. There is no established denominator for a “100% inspected” claim.

**SDK continuation:** the [compatibility/privacy report](sdk-compatibility-privacy-analysis.md) now inventories selected contracts at one pinned wrapper revision and records 26 browser-free observations of our actual SDK. It reproduces dropped JS context fields, Python viewport/argument differences and dropped Puppeteer proxy bypass. These close specific source/adapter questions; they do not qualify native runtime behavior or resolve the remaining ledger entries.

**23 October implementation:** [the compatibility patch checkpoint](compatibility-patches-20261023.md) records the native API repair and implemented SDK regressions. The failed native translation unit passes syntax checking; full linking and browser qualification are pending. Updated driver-boundary reports are separate from the preserved pre-change observations. No additional native function recovery or detector parity is claimed.

## Coverage ledger

| Question | Existing evidence | Status | Acceptance criteria for a bounded conclusion |
| --- | --- | --- | --- |
| Which artifact was inspected? | Original archive/DLL hashes, version resource and resource inventory | Answered for the selected artifact | Retain original identity and bind every derived observation to it |
| What does the public SDK promise? | Fourteen pinned public source files, six Python launch signatures, three JS launch interfaces, comparison report and 26 own adapter observations | Answered for selected launch contracts; broader product remains partial | Runtime behavior, native semantics, distribution and all platform claims require separate qualification |
| How does locale configuration behave? | One native slice dossier; partial callee coverage; SDK launch-path gap | Partial | Trace relevant value validation/fallback boundaries and test navigator, Intl and HTTP language behavior on local fixtures; specify process/context/worker scope |
| How does timezone configuration behave? | One native slice dossier; partial callee coverage | Partial | Establish supported identifiers, invalid-input handling, Date/Intl and DST behavior across declared contexts/workers using local fixtures |
| How does font configuration behave? | Native option-dependent cache branch; truncated value flow | Partial | Resolve collection loading, validation, fallback and cache invalidation; measure font availability, metrics and rendering on supported hosts |
| How does storage accounting behave? | Native storage-related references and one partial dossier | Partial | Establish units and policy boundaries; test real writes, usage, limits, errors, profile reopening and isolation; reported values must agree with actual behavior |
| Do persistent profiles work? | Public wrapper seed handling; own SDK source | Not qualified on finished 155 binary | Verify cookies, localStorage, IndexedDB, profile seed reuse, locking and isolation across restart |
| Are drivers compatible? | Existing implementation and planned gates | Not qualified on finished 155 binary | Run pinned Playwright, Selenium/CDP and Puppeteer navigation, context, input and shutdown fixtures in headed/headless modes; record versions and failures |
| Are authenticated proxies and extensions supported? | Selected SDK guards; no complete native trace | Unresolved | Use owned local proxy and extension fixtures; verify authentication, routing, failure handling and launch/persistent-context contracts |
| Are hardware/rendering defaults coherent? | No sufficient native or runtime evidence in this pass | Unresolved | Compare real host GPU/display/font output and rendering fixtures on each claimed platform and mode |
| What changed relative to stock Chromium? | No independently matched stock build comparison | Unresolved | Identify matching upstream revision and build inputs; distinguish compiler/configuration drift from attributable semantic differences; preserve unresolved attribution |
| Were all advertised native patches recovered? | Four partial dossiers; no original C++ patch set | Unresolved | Requires an authoritative, scoped patch manifest/source or substantially more evidence; neither function enumeration nor decompiler output proves completeness |

## Implementation gates

Finish and qualify the active silly-browser 155 build first. Keep the current six-worker compiler running; do not mutate its source, resync dependencies or reapply patches during compilation. Read live process/log state before resuming work.

For each subsequent compatibility or documented privacy feature, write an independently justified behavior contract and a failing local acceptance fixture. Implement one ready change, then run the fixture against the actual built binary in applicable display modes. Record the source revision, patch identity, binary hash, driver version, results and remaining limitations. A successful REA query alone does not close an implementation gate.

The next concrete source-observed issue is the JavaScript locale/timezone/viewport contract described in the [inspection report](cloakbrowser-native-inspection.md): ordinary browser launch accepts fields that are not applied as context defaults. Choose explicit propagation or rejection without silently changing legitimate context isolation. This is separate from native engine recovery.

The earlier native pass used two logical CPUs, BelowNormal priority, a 2 GiB Java heap and a 4 GiB job committed-memory cap. The user subsequently authorized a larger budget as needed while preserving compilation; choose that budget from live available resources rather than exhausting the machine. This continuation reused retained evidence and ran lightweight SDK probes, with no new Ghidra worker. A larger pass is complete only for its declared questions and search boundary; unresolved callees, omitted ranges and truncation stay visible.

## Scope boundary

Compatibility, rendering correctness, profile persistence, explicit privacy policies and driver integration are supported investigation and implementation scopes. Reproducing automation-concealment or anti-bot/CAPTCHA-bypass mechanisms is outside this work. Detector scores do not substitute for these acceptance criteria.

No new browser patch or native function analysis was performed when creating this ledger or its SDK continuation. The continuation adds source/adapter observations and retained native views; it does not increase native function coverage.
