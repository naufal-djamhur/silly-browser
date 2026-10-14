# Iteration 2 — custom-engine integration validation

Date: 14 October 2026, Asia/Jakarta. Starting source-project commit: `39e5aebceaa7972f3be52bd03df49711f5a1dbc4`.

**Outcome:** step 1's completed Windows build was verified and step 2's missing local checks passed. No Chromium source patch was modified and no new compilation was launched.

## What was verified

The stage file recorded the completed native build and original integration test. No active compiler remained. The exact applied two-patch checkout verifier passed. The current executable hash matched the completed ten-case custom-engine driver report. The new checks additionally captured the runtime DLL hash and confirmed the actual browser version `146.0.7680.177`.

The expanded JavaScript suite passed 28 checks. Two native controls and fourteen SDK identity cases produced 80 observations across documents, same-origin iframes, dedicated workers, shared workers and service workers. Headed/headless modes, three default platform presets, explicit `12.3.4` platform versions and native preservation were exercised. This validates web identity settings on a Windows binary; it does not establish native Linux/macOS graphics or fonts.

Persistence checks exercised stored seed -> reopen -> explicit zero override -> stored seed restore, cookies and localStorage retention, corrupt-seed preservation and removal of temporary profiles. Direct engine startup accepted zero, maximum uint64 and leading-zero representation, generated two bounded seeds, and rejected eight malformed option combinations with real nonzero exits. No probabilistic claim was made from two random observations. Browser and owned renderer process flags were checked for seed/platform propagation.

Five additional Python checks exercised sync Windows profiles, async macOS profiles, a sync Linux browser, an async native temporary context and rejected options. These are Windows executions of the identity presets, not native platform certification. The ten earlier passing driver smoke checks were reused because the engine executable hash matched; their original runtime-DLL hash was not recorded, which is disclosed in the summary.

## Fixture corrections and limits

The first extended fixture run returned 13 passes and 15 failures caused by two test assumptions: native worker fetches omitted Client Hints, and Browser.getBrowserCommandLine required `--enable-automation`. Native controls established the header availability. The assertions now require correct headers where emitted and preserve their native absence elsewhere. Command-line inspection tests explicitly use the diagnostic flag; the ordinary identity checks retain their original launch settings. The initial fixture result is retained locally, separately from the final 28-pass report.

Native identity preservation compares direct and SDK launches of the same custom binary. An independent unpatched Chromium 146 build was not produced. Cross-origin frames, out-of-process frame transitions, native GPU/network-service switch propagation, foreign hardware/font consistency and every automation API are outside this iteration's evidence.

The engine handshake's `fingerprintIntegrationValidated=false` remains a fixed conservative marker in the existing binary. The [external summary](engine-validation-summary.json) records the measured scope. Production support arrays remain empty and every planned version retains its qualification boundary.

## Reproduce locally

Use Node >=22.12 and Python with the project SDK installed, set the actual custom executable, then run from the project directory:

```powershell
$env:CUSTOM_BROWSER_EXECUTABLE='PATH_TO_BUILT_CHROME.exe'
npm run test:engine
python tests/python_custom_engine_test.py
```

The current extended suite is for the Windows x64 build and records `chrome.exe` and `chrome.dll` hashes. Without the required executable setting, qualification fails instead of treating skipped checks as a pass. Use bundled runtimes on this workspace as described in the private continuation note.

Raw local evidence is kept in `artifacts/engine-validation/windows-146-step2/results.json`, `python-results.json`, and `initial-fixture-assumptions.json`; the retained driver report is `artifacts/compatibility/custom-windows-146/results.json`. These files are ignored by Git. Public [summary evidence](engine-validation-summary.json) excludes local profile paths and process identifiers.

**Next action:** begin step 3's supported-stable rebase in a later iteration, preserving this integration binary. Update [session handoff](session-handoff.md) after that work.
