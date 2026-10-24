# CDP timezone lifecycle contracts

Defined and exercised **24 October 2026**, against Windows x64 Chromium **155.0.8059.80**. This is the N8-1/N8-2 contract record from [the iteration plan](next-native-iteration-155.md). Runtime outcomes and candidate qualification belong in [the lifecycle report](cdp-lifecycle-155.md).

## Contract sources and scope

The pinned `third_party/blink/public/devtools_protocol/domains/Emulation.pdl` defines `setTimezoneOverride`: its string identifier selects a supported ICU timezone, and an empty string clears the override and restores the host default. The native controller's header defines exclusive ownership of the renderer-global override through an RAII handle. These are explicit emulation settings; the fixtures do not modify automation status, browser identity or third-party diagnostic behavior.

The same-version unpatched source control is an implementation comparison, with its preserved incremental/shared-artifact build limitations. Shared upstream behavior can still be defective when it violates an established contract. An unspecified multi-client or worker relationship remains observational rather than being converted into a failing equality assertion.

The native process-default configuration adds `fr-FR` / `Europe/Paris` on the custom runtime. The ordinary configuration uses the actual native baseline. Baselines are sampled per fixture, not hard-coded to this machine's timezone.

## Assertions and observations

| Scenario | Asserted contract | Scope/qualification |
| --- | --- | --- |
| Interleaved valid/invalid updates | Valid identifiers are accepted; rejected identifiers do not change effective locale/timezone/offsets; clear restores baseline | Includes ordinary invalid names and valid prefixes followed by embedded NUL plus extra characters |
| Rejected update, cross-site navigation and return | The last accepted timezone survives both navigations | Extends the previous one-way rejection/navigation observation |
| Rejected update, reload and document replacement | Accepted state remains effective and the renderer remains usable | Same target's document lifecycle |
| Detach immediately after rejection | Releasing the session restores its native baseline | No intervening navigation to mask the result |
| Target close and replacement | A new target does not retain the closed target's temporary setting | Fresh owned target in the existing context |
| Persistent-profile relaunch | Owned local storage survives; temporary CDP state does not survive browser relaunch | New test-owned profile; no manual/user profile access |
| Multiple clients | A conflicting non-owner update is rejected without changing owner state; ownership can be reacquired after release and cleaned up | Matching second-client requests and state after the original owner detaches are recorded; independent ownership is not promised |
| Worker creation/termination | Native defaults are correct and restored after clearing temporary state | During-override worker inheritance is recorded as observation-only |
| Initial malformed identifiers | A malformed nonempty identifier is rejected without changing the initial baseline | Separately exercises acquisition rather than only the existing-handle update path |

There are nine scenarios because the malformed-identifier finding required an additional initial-acquisition control beyond the eight planned lifecycle cases. Each custom runtime is exercised under default and explicit native configuration, each headed and headless: **36 scenario observations**. The upstream control uses its native configuration in both modes: **18 observations**.

## Native defect acceptance

`Pacific/Honolulu` is a supported identifier. The distinct string `Pacific/Honolulu\u0000Invalid` is not that identifier. Accepting the latter as its prefix violates validation, even when the effective zone happens not to change. Accepting a different valid prefix can additionally change the effective zone despite malformed input.

The RED baseline records both acquisition and update acceptance, with selected effective-state changes. Native C++ checks must reject embedded NULs before canonical comparison or conversion to NUL-terminated ICU inputs. Runtime acceptance requires rejection on both paths, unchanged effective state, and continued passing lifecycle controls. Existing canonical aliases and empty-string clear behavior must remain valid.

## Test runner and evidence

The implemented fixture is [cdp-timezone-lifecycle-browser.test.mjs](../tests/cdp-timezone-lifecycle-browser.test.mjs). Set `CUSTOM_CDP_LIFECYCLE_ENGINES` to a private JSON list with `id`, `executable`, `version`, `exeSha256`, `dllSha256` and optional `nativeEnvironment: true`. Set `CUSTOM_CDP_LIFECYCLE_REPORT` to a **fresh** output directory, then run:

```powershell
npm run test:cdp-lifecycle
```

The runner verifies hashes, creates owned loopback sites, uses isolated contexts/profiles, records checks individually and produces a nonzero exit when any asserted contract fails. Node's outer test adds one test-result wrapper; report scenario counts separately to avoid counting that wrapper as another browser observation. Post-close runtime hashes are also checked.

The baseline run contains **54 observations: 36 passes and 18 failures**. Patch seven contributes 28 passes / eight failures; the upstream control contributes eight passes / ten failures. The upstream failures additionally include the known invalid-update state defect fixed by patch seven. These are intentional RED correctness controls, not collection failures. Candidate results and remaining limitations are recorded in the lifecycle qualification report.
