# Chromium 155 five-patch build — 23 October 2026

The user authorized incremental build continuation after the native timezone/locale and Windows font-directory implementation. The existing physical Windows checkout was verified against the exact five-patch series for **155.0.8059.80**, source commit `43a195105613ac83c21d3f14de279f4a045c7da0`. Repository checkpoint: `b108cd3`.

## Live checkpoint

**Latest recovery:** after a PC restart, incremental compilation reached a locale-patch scoping error in `SandboxInitialized`. The missing command-line reference is corrected in the applied source and saved patch; that exact object compiles and the complete five-patch checkout verification passes. The full incremental pipeline was restarted at 10:01 WIB with prior output preserved. See [the recovery evidence](native-startup-build-fix-20261023.md); inspect live state before acting on older process details.

- Installed Visual Studio, MFC/ATL, SDK and debugger preflight passed.
- Exact five-patch source verification passed.
- GN regeneration passed: 35,755 targets from 5,036 files.
- Incremental compilation resumed with six workers in a visible PowerShell terminal. Existing completed output was preserved; no dependency synchronization or patch reapplication ran.
- A matching-build ChromeDriver, **155.0.8059.39**, is present in the local driver cache. Actual Selenium compatibility remains unmeasured on the new binary.
- The build is **in progress**, with no linked five-patch runtime or passing browser validation claimed at this checkpoint.

The resumed graph initially contains roughly 32,500 actions. Its denominator can change as dependencies are skipped or discovered; this is not a percentage of the entire browser project. Preserve the active build and inspect live process/status/log state before any restart.

## Validation after linking

The continuation runner requires engine identity/seed checks, Python integration, the local WebRTC policy fixture, context isolation, native process timezone/locale and Windows font loading, followed by ten driver compatibility checks across headed and headless modes. It prepares a local Ahem-only font fixture and fresh native/context report paths. Results must be bound to the completed executable and runtime DLL hashes.

Native flags are tested without SDK locale/timezone emulation. The native fixture checks HTTP language, document/iframe and worker values, DST, and a native `local()` Ahem font load with expected canvas advance width. See [native implementation and qualification](native-environment-fonts-20261023.md) and [post-build validation](post-build-validation.md).

If a check fails, retain its evidence and reproduce the specific browser, rendering, configuration or driver difference before changing source. A user-driven browsing comparison and REA can support authorized E2E diagnosis. The user clarified that reducing automation-specific differences is in scope, while CAPTCHA solving/bypass is outside the requested project. Detector classification alone does not establish an incorrect browser behavior; this checkpoint does not claim universal detector outcomes or CloakBrowser parity.

## Hardware and build settings

The host has a Ryzen 5 7500F with six cores/twelve threads and about 32 GiB RAM. The running build uses six workers; memory headroom is monitored. Clang compilation runs on the CPU. The current configuration already uses `symbol_level = 0`, an x64 non-component release build, and the `chrome` target. Changing global build settings now could invalidate completed work, so they remain unchanged during this run.
