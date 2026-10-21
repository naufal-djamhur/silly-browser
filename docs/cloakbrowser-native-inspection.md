# Free CloakBrowser native inspection — 22 October 2026

This bounded initial inspection of the free Windows **146.0.7680.177** engine is complete. Four native function dossiers and explicit option-byte observations were captured using verified analytical slices. This is not a reconstruction of the current CloakBrowser 155 patch set. Chromium 155 compilation in the separate silly-browser checkout is preserved. No browser C++ source was changed during this investigation. The [sanitized summary](cloakbrowser-native-inspection-summary.json) records the evidence identities and limitations.

## Subject and controls

The official release asset is `chromium-v146.0.7680.177.5/cloakbrowser-windows-x64.zip`. Its verified archive SHA256 is `b213795cb32c3169f766c74ce1d0275fc89d3df256de39c04da7fb4c23b7fdbe`. The selected `chrome.dll` is **295,008,256 bytes**, SHA256 `ed7009a70d76fa4da222a5b37c34012d77fcc04092ef8df5fb572062940fa4dd`. Windows version-resource decoding reports product/file version `146.0.7680.177` and product Chromium. The comparator was not executed or redistributed.

REA 6.7.0 uses Ghidra 12.1.4 and the existing JDK 22. Analysis runs in an owned Windows Job Object with affinity mask 3 (two logical CPUs), BelowNormal priority, a **4 GiB total job committed-memory limit**, and a **2 GiB Java heap**. Actual JVM affinity/heap flags and family memory were sampled; one default-pass observation was 3.08 GiB family private memory with 7.14 GiB host memory free. The native authority's path/DACL/ownership checks remain enabled. The Chromium compiler family is outside this job.

## Evidence and scope

| Evidence | What it establishes | Limit |
| --- | --- | --- |
| REA `open_binary` result | The exact PE x64 DLL identity/hash | Opening does not complete native analysis |
| REA `inspect_pe_resources`, `ev_65291f675342a395f12a3f96deedebbc7fe7308655c7f718aabb1a98317a5890` | Static resource inventory, payload ranges and hashes on the actual DLL | Most resource payloads remain opaque; no runtime behavior |
| Read-only PE/byte preprocessing | Fourteen PE sections; option-literal locations and file/address mappings | Ordinary shell/Python observations, not REA Evidence |
| MSVC disassembly of nine selected unwind-table ranges | Decoded instructions using the selected literal addresses | Ordinary disassembler observations; no original symbols/source recovered |
| Public wrapper source, local revision `160f56da85860e89f0e7d9bfdc80266b984057d5` | Profile seed creation/reuse is implemented in the wrapper | Wrapper revision is a separate reference, not proof of every behavior in this native artifact |

The initial default Ghidra pass was deliberately cancelled after a JVM thread dump showed broad `Disassemble Entry Points` work. No completed overview or decompilation result is claimed for that pass. A first focused worker did not complete MCP initialization; the scoped CLI doctor still passed. The subsequent instrumented worker connected successfully.

The module-wide experiments used nine exact candidate function-entry seeds, digest `015387f8758654025e9ce457e14ce5297ef348f62d4811fedfb000bafe4e42f4`. An initial configuration included Function Start Search, which was not registered for this PE program; REA correctly rejected that override. Later thread dumps identified broad Reference/Data Reference discovery. These experiments were retained as incomplete, not counted as successful function inspection. The final small-slice pass used **normal Ghidra analysis with those nine seeds and no disabled analyzers**; its recorded analysis-profile digest is `a6ad13ee20cd415636d0a0ca9669a54ec2ab71e96ca58aaf8f669cba57727189`. Analyst-supplied `candidate_...` names are not recovered original symbols.

The original-DLL focused attempt was also stopped after a thread dump showed `ExceptionDataDirectory.markup` in the PE loader, before the selected analysis settings could apply. The original exception directory contains 378,670 valid runtime-function records. For bounded function inspection, a declared static-analysis view clears only the eight-byte `IMAGE_DIRECTORY_ENTRY_EXCEPTION` directory entry at file offset 280. Six bytes actually differ; the other two were already zero. All fourteen section payload hashes, including code, read-only data and the original unwind-table section, are unchanged; image base and section addresses are unchanged. The original file remains untouched. The view SHA256 is `b6206542eab55bb67b2a7e46dd704a7266dd53cf5377ca569d2eb6c5990615e5`.

Any analysis using that larger view requires its own derived-hash attribution and a derivation manifest linking it to the original. No completed native function evidence was produced from that larger view. Exception/unwind interpretation is omitted, and runtime equivalence is not established. No analysis copy was executed. This is a metadata projection for inspection, not a new browser build or a modified distribution.

The module-wide passes continued to incur broad discovery costs. The final bounded input is a smaller **address-preserving function/data slice**, SHA256 `f3a82793b25eed3865b006faedff28182d9807c185089782c1c104e38b258b99`, 231,936 bytes. It maps 48 source-backed ranges covering the nine selected functions and directly referenced code/data pages. Every copied payload hash was compared with the original DLL, and original virtual addresses and section permissions are preserved. Its new PE headers omit startup, import, relocation, resource, unwind and exception directories; code/data outside the mapped ranges are absent. The slice is never executed. Native dossiers from this slice describe these bytes with unresolved external callees/globals, not the complete original program. The full-module attempts have not produced completed native function evidence.

## Captured native dossiers

All four queries returned actual REA/Ghidra dossiers, including pseudocode, assembly and bounded high p-code. The nine native records were exported to an 8.5 MB local evidence bundle, imported into the now-connected REA session, and selected retained views were verified without re-analysis. The target was closed and owned analysis processes exited. Raw code, binaries, slices and the complete bundle remain local.

| Control | REA function Evidence | Observed scope and remaining limits |
| --- | --- | --- |
| Timezone | `ev_9880d5b5c5d55ed9046fc8fb98e926664668d1d6b31162bc6c3492fc3d0ccfe4` | An override-check/value-handling path and fallback route are visible. Twelve callee targets are unresolved; ICU behavior and propagation to all contexts/workers are not qualified |
| Locale | `ev_932ad5c9a11a710d16a231357d568311bb3d9937ec1e1a1dd94ff16572558547` | A native option-check/value-handling path is visible. Twenty callee targets are unresolved, and type propagation warns that it did not settle |
| Storage | `ev_bb9cd19e58a0c85d7af4fa55a2868e25496351a8262c41d400924936a93118ed` | Local control flow is captured, with 25 unresolved callee targets. A bad-instruction warning corresponds to an original `ud2` guard at `0x18ca2c11b`, confirmed against the original DLL disassembly. This is not evidence of browser corruption; full accounting semantics remain unresolved |
| Fonts | `ev_b6b51ba25eea0178245158fd541163156b1fc9203844768a3de6ca21c77f4962` | A native cache branch consumes the font-directory option; directory loading is not established. Ninety-three callee targets are unresolved, type propagation warns, and the high-p-code value-flow record is truncated |

The explicit native byte reads at the four option addresses returned all 32 requested bytes, matching the source-backed slice. Their Evidence identities are in the sanitized summary. Every function dossier reports **partial callee coverage**. A successful query is not a successful runtime test, complete source recovery, or proof that a policy works in both display modes. REA's generic artifact authority refers to the selected analytical input; the slice manifest provides the separate binding to the original shipped DLL.

## Observations and engineering implications

| Area | Observed in this artifact | What silly-browser can implement or validate |
| --- | --- | --- |
| Font policy | A decoded reference to `fingerprint-fonts-dir` occurs in the unwind function beginning at `0x18ad5be20`; the full saved range contains the `FontCache::GetFontPlatformData` trace label and font-family literals | Design an explicit font-collection policy with existing host fonts as the default. Validate font availability, fallback, metrics and rendering together; a UA string alone cannot supply another platform's fonts |
| Timezone | `fingerprint-timezone` is referenced in three selected ranges: `0x18b6d2140`, `0x18b6d2470`, `0x18b6d4ad0`; the decoded code performs lookup/branching and consumes the value | Add an explicit process-scoped timezone policy only with document, iframe, dedicated/shared/service-worker, Date/Intl and DST tests. Parsing a flag is not evidence that all consumers agree |
| Locale | `fingerprint-locale` is referenced in selected ranges `0x186870eb0` and `0x1868cfe00`; the larger range also contains language preference names | Validate configured locale across HTTP Accept-Language, navigator language APIs and Intl. Specify process/context scope and reject ambiguous conflicting options |
| Storage accounting | `fingerprint-storage-quota` is referenced in several ranges. Range `0x183ffa7e0` also carries an IndexedDB backing-store source path; other selected ranges carry storage-quota labels | Any explicit storage-privacy policy needs coherent reported quota/usage, IndexedDB/cache behavior, persistence and error handling. Do not treat changing one JS-reported number as a complete implementation |
| Screen and desktop identity | Platform/version and screen-width/height literals are present, with candidate native references saved | Start with paired geometry and identity fixtures. Use existing SDK/Chromium controls where they already produce correct results; add native policy only for a reproduced inconsistency |
| WebRTC, proxy transports and native GPU handling | Selected WebRTC-option literals are present; these deeper code paths were not traced in this pass. GPU passthrough and SOCKS5/QUIC behavior are unqualified | Keep the current explicit WebRTC policy gates separate from spoofing claims. Measure actual STUN/DNS/proxy routing and real hardware output before claiming support |
| Persistent identity | The public wrapper creates and reuses a profile seed file; silly-browser already has its own profile seed mechanism | Revalidate cookies, storage, seed reuse, concurrent profile creation and isolation on the finished 155 binary. This does not require inventing another native patch merely to increase patch count |

Literal presence, number of references and number of functions are not patch counts. The strings alone do not prove the feature is enabled, correct or complete. Native propagation, units, fallback rules, failure handling and runtime outcomes remain separate questions. No independently built unmodified binary with matching compiler/build settings was analysed, so this is not a definitive attribution of all differences to CloakHQ patches.

## Concrete SDK gaps found during comparison

Silly-browser's JavaScript `buildLaunchOptions()` accepts locale/timezone/viewport fields, but the plain `launch()` path returns a browser without applying those fields as context defaults. The persistent-context path explicitly applies locale and timezone. This is a source-observed contract gap; its acceptance test should distinguish a returned Browser from a configured BrowserContext. Decide whether to propagate documented defaults or reject unsupported fields, then prove the behavior on the finished binary. Do not silently accept an option that has no effect.

The Puppeteer adapter explicitly rejects locale/timezone and authenticated proxy options. These guards are honest limitations, not equivalent support. The reference wrapper documents its timezone flag as process-wide, including all contexts. Choosing a native process-wide policy for silly-browser would require an explicit scope decision; it must not accidentally remove legitimate context isolation. These are useful bounded follow-up tasks before attempting broad native parity.

The font-directory reference in the selected native range tests an option-dependent branch. Directory loading, font-file validation and platform-specific behavior have not been established by that observation. They require further tracing and actual rendering fixtures.

## Implementation order after the active build

1. Finish the actual 155 build and its configured engine, Python, WebRTC and driver gates in both display modes where applicable. Preserve binary hashes and fix a real failing gate first.
2. Run the [five-example comparison](cloakbrowser-comparison-plan.md), especially explicit navigation/profile assertions, and the paired local [headed/headless fixtures](headless-headed-e2e-plan.md).
3. Choose one concrete missing configuration contract: timezone/locale propagation is a bounded first candidate; font-collection support is a separate rendering iteration. Write local acceptance criteria and implement independently against the selected Chromium revision, rather than transplanting version-specific disassembly.
4. Treat storage-accounting changes as a separate correctness-sensitive iteration. Test real writes/usage/limits and profile reopening before exposing an option. Do not copy constants from a proprietary binary into engine accounting without an independently justified design.
5. Investigate authenticated proxies, extension loading and broader transport behavior with dedicated fixtures. They are not qualified by a successful fingerprint or navigation example.

## Question status

| Question | Status |
| --- | --- |
| Exact free artifact identity and resource inventory | Answered for the selected original DLL |
| Presence of compiled timezone/locale/font/storage control paths | Partially answered through source-bound disassembly and four native slice dossiers |
| Full semantics, worker/context propagation and rendering consistency | Unresolved; needs further callees and actual runtime fixtures |
| What should be implemented next in silly-browser? | Concrete SDK contract gaps and independently designed configuration/font/privacy iterations are identified above |
| Full native patch inventory, GPU/proxy/input behavior and parity with the current 155 product | Unresolved |

No native patch has been recovered in original C++ form, no new engine capability has been qualified, and no detector/CAPTCHA outcome is inferred. The exact advertised 87-patch inventory and current-release parity remain unresolved.
