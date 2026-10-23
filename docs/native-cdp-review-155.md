# Native Chromium/Blink and CDP review

**Implemented follow-up:** [CB-0007 and its separate candidate](cdp-timezone-validation-155.md) now pass the owned regression in both modes. The review/proposal checkpoint below is preserved as the pre-implementation record.

Reviewed and measured **24 October 2026**, Windows x64. **A real CDP timezone validation/state bug is reproduced in both modes on Silly Browser 155, its upstream-source 155 control and the saved free CloakBrowser 146.** A [three-file C++ patch proposal](proposals/cdp-timezone-validation.patch) is prepared and dry-applies cleanly to the current six-patch checkout. It is **not applied, compiled or browser-validated**. The [summary](native-cdp-review-155-summary.json) binds the reproduction, selected source files and proposal to hashes.

## Why the reference gets better detector results

The [fresh three-browser measurements](detector-comparison-155-146.md) establish observable differences: CloakBrowser reports false for the selected WebDriver/CDP checks and has no headless user-agent flags in CreepJS. Silly and stock 155 report active automation and, in headless mode, headless user agents in document and worker. CreepJS's three-flag calculation explains its 0% versus 33%/100% headless results. Fingerprint Scan displays Browser MEDIUM +43 for the saved reference versus HIGH +305/+480 for the two 155 browsers. The remaining reference score of 43 and every internal scoring weight have not been assigned a verified cause.

Those observations do not recover the reference's native implementation or establish a functional defect in those indicators. The version difference also remains: this is saved free 146, not current Pro 155. The native defect found below also occurs in that reference, so it does **not** explain its better detector scores. No detector-concealment implementation is proposed.

## Confirmed native defect: invalid timezone update corrupts saved state

The owned loopback CDP probe reproduces this sequence:

1. An initial `Emulation.setTimezoneOverride` with an invalid identifier correctly returns an invalid-parameter error.
2. Set the valid timezone `Pacific/Honolulu`. Its Date offsets are +600 minutes in January and July.
3. Navigate to a second loopback site and back. The valid timezone survives both navigations: this is the positive control.
4. Send the same invalid identifier while the valid override is active. **CDP returns success**, while the effective timezone stays Honolulu.
5. Navigate to the other site again. The last valid override is lost and the page returns to its native timezone.

| Runtime/configuration | Cases | Valid-only navigation preserved | Invalid update incorrectly accepted | Last valid zone lost after navigation |
| --- | --- | --- | --- | --- |
| Silly patch six, ordinary defaults | Headed + headless | 2/2 | 2/2 | 2/2 |
| Silly patch six, native `fr-FR` / `Europe/Paris` | Headed + headless | 2/2 | 2/2 | 2/2 |
| Upstream-source 155 control | Headed + headless | 2/2 | 2/2 | 2/2 |
| Saved free CloakBrowser 146 | Headed + headless | 2/2 | 2/2 | 2/2 |

All **eight observations** completed with usable renderers, no recorded crash/page error and no collection error. The strict desired-contract gate exits **1 (RED)** on these unchanged runtimes. This is not a passing runtime qualification.

The native-default cases restore Paris after clearing overrides; ordinary cases restore the host timezone. Separate-context observations remain unchanged. ICU-style `de_DE` and BCP47 `de-DE` locale overrides work, invalid locale updates are rejected, locale reset works, and detaching an active timezone session restores the baseline. Those checks do not justify a locale patch in this iteration. The probe does not claim comprehensive worker or multi-client lifecycle coverage.

## Concrete C++ proposal

The selected 155 source explains the inconsistent response and saved state:

- `third_party/blink/renderer/core/timezone/timezone_controller.h`: the owned override handle's `change()` returns `void`.
- `third_party/blink/renderer/core/timezone/timezone_controller.cc`: `ChangeTimeZoneOverride()` rejects an invalid ICU timezone internally, but cannot return its failure to the agent.
- `third_party/blink/renderer/core/inspector/inspector_emulation_agent.cc`: the existing-handle branch calls that helper, then stores the requested identifier and returns success unconditionally. The stored invalid identifier is later used during agent restoration.

The [draft patch](proposals/cdp-timezone-validation.patch) makes the helper and handle method return a boolean. The agent returns `InvalidParams` immediately on failure, before changing serialized state. The active override and saved identifier therefore retain their last valid values. It reuses existing ICU validation, preserves canonical-equivalent successful updates and introduces no identity, user-agent or automation-status changes.

Before implementation is called complete:

1. Apply the proposal as an independently tracked fix, then compile a separate candidate without overwriting either qualified 155 runtime or the reference.
2. Add the valid-then-invalid sequence and navigation control to the existing Blink inspector-protocol regression coverage. Its current invalid-timezone test exercises only the initial invalid request.
3. Run a strict candidate-only protocol gate in headed/headless mode, including explicit native defaults. Invalid updates must fail, the last valid zone must survive navigation, and reset/detach/context checks must stay correct. Keep stock/reference as known RED controls.
4. Run the affected native environment/context/worker tests and CDP driver routes. Publish actual candidate hashes/results before qualifying a new patch count.

The new owned probe is `benchmarks/cdp_emulation_probe.mjs`. It accepts the same private engine-list format as the detector comparison, plus a fresh output directory. `--expect-fixed` requires every selected observation to satisfy the desired timezone contract; without it, complete diagnostic collection can exit zero while reporting defects. The current fixed native-default case is selected for the `silly-patch-six` engine label; extend that selection for a newly named candidate when implementing the regression gate.

## Separate release configuration proposal

The zero CDP revision string is explained by `build/util/lastchange.gni`: `use_dummy_lastchange` defaults to `!is_official_build`. The current nonofficial configuration deliberately selects `LASTCHANGE.dummy`. The real `build/util/LASTCHANGE` already records the upstream revision `43a195105613ac83c21d3f14de279f4a045c7da0` and its branch position.

The source trace reaches `BrowserHandler::GetVersion()`, which reads generated `CHROMIUM_GIT_REVISION`; the `build/util` generator takes the selected lastchange file. The existing generated header contains the same zero revision returned at runtime.

If the release must expose its upstream revision through `Browser.getVersion`, set **`use_dummy_lastchange=false`** in the release build recipe, regenerate version metadata and verify it against Git/LASTCHANGE. Preserve the custom patch manifest as additional fork provenance. This is a build-configuration choice, not a C++ defect or a reason to substitute a fabricated revision in the CDP handler. It is not applied or validated here and carries no detector-score claim.

The prior zero-revision observation remains accurate; this review resolves its previously untraced cause. The supported release metadata policy and resulting rebuilt assets still need qualification.

The existing six-patch source and all three EXE/DLL pairs remain unchanged. No compiler or full pipeline was started. The proposal fixes a confirmed protocol contract problem; no Fingerprint Scan or CreepJS score improvement has been demonstrated or promised.
