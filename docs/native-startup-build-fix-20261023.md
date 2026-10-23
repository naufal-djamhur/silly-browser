# Native startup compile recovery — 23 October 2026

After the PC restart, the existing Chromium **155.0.8059.80** build resumed incrementally. It later stopped at **14,986 completed actions, one failed action and 1,234 remaining** in that run's graph. The failed target was `obj/chrome/chrome_dll/chrome_main_delegate.obj`; these counts describe the resumed graph, not total project completion.

The locale patch added an ICU locale restoration in `ChromeMainDelegate::SandboxInitialized`. That callback referenced `command_line`, which was local to a different callback. Clang reported an undeclared identifier at the `HasSwitch` and `GetSwitchValueASCII` calls.

The fix binds a local immutable reference to `*base::CommandLine::ForCurrentProcess()` at the point of use. Both the applied checkout and the saved `0004-native-locale-timezone.patch` were updated. The series remains **five patches**; this is a correction to the existing locale patch, with no intended runtime behavior change.

## Verification

The exact failed translation unit was rebuilt through the existing generated build graph, using the same compiler flags as the full build:

```powershell
third_party\siso\cipd\siso.exe ninja --offline -C out/SillyBrowserStable obj/chrome/chrome_dll/chrome_main_delegate.obj -local_jobs=2
```

Result: **Build Succeeded: 1 step**, exit code 0, 24.27 seconds. This is a full object compilation, including Chromium's compiler plugins, rather than a body-only syntax probe.

`build/verify_applied_checkout.py --release 155.0.8059.80` also passes against the full source checkout: the exact corrected five-patch series reverses successfully to the pinned original file hashes. The upstream commit remains `43a195105613ac83c21d3f14de279f4a045c7da0`.

The following hashes identify the intermediate scoping-fix object, before the later early-exit repair described in [the completed validation report](engine-validation-155.md). Use that report's runtime pair and patch digests for the final tested build.

| Intermediate verified file | SHA256 |
| --- | --- |
| Applied `chrome/app/chrome_main_delegate.cc` | `76665fef8c8a7dd64887cf960828dc8d9129a8aa1160675c6e5b1cd42d1cb11e` |
| Compiled `chrome_main_delegate.obj` | `46d57f93fcb2fcd7e91b23117796b0c42ed395e6c4862e4c499a1d1629ebc4d8` |
| Corrected locale patch | `656d28e2fcfd4ef781b0e22b45e7c8270b6854cf475b76198cd0b63aaad62121` |

Full incremental compilation was restarted at **10:01 WIB** in a visible PowerShell terminal, preserving completed output and the six-worker configuration. No dependency sync, source reset, clean build or patch reapplication was used. Inspect the live status and log before any further restart. The existing pipeline still runs the native/context/driver gates after linking; the separate optional-font helper must follow the new runner process after this recovery.

The failed action, original source/patch, targeted-build output and restart receipt are retained in the private workspace recovery folder. Linking, browser runtime tests, actual font rendering and complete release qualification remain pending.

**Final outcome:** compilation/linking completed. Validation then exposed an early CRT-exit crash, repaired with Chromium's immediate-exit API and a diagnostic stdout flush, and an empty-frame visibility assumption in the context fixture. The final binary passes all 48 local gates in the linked report; full release/MVP qualification remains separate. The private recovery folder retains each failed report and the CDB stack.
