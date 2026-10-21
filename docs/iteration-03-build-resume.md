# Chromium 155 build resume — 22 October 2026

The pinned **155.0.8059.80** Windows x64 build has resumed native compilation. Dependency synchronization, build hooks, ordered patch application, exact three-patch verification and GN generation have passed. There is no completed stable binary or stable browser-validation claim yet.

## Dependency repair

The earlier path-only `custom_deps=None` setting did not exclude the CIPD updater package: the actual retry still registered it and failed under Windows Defender. Syntax validation alone had not established the exclusion's behavior.

The new [dependency generator](../build/prepare_browser_deps.py) reads `DEPS` directly from the locked Git commit, checks that the tracked file has no local changes, and writes a separate browser-only dependency manifest outside the source tree. Only the value for `src/third_party/updater/chrome_win_x86/cipd` becomes `None`; every other dependency and setting is preserved. This is prebuilt x86 updater-test data, outside the selected x64 browser target. The original tracked DEPS file is unchanged. No blocked artifact was restored/executed and no antivirus setting was changed.

The root `.gclient` selects the generated manifest through its `deps_file` option. Recursive dependencies retain their normal DEPS files through gclient's standard fallback. Actual synchronization then passed, followed by all build hooks. Two [scope/guard tests](../tests/browser_deps_test.py) pass, checking preservation of other entries and rejection of ambiguous or unexpected package definitions. The [dependency profile](../engine/releases/155.0.8059.80/dependency-profile.json) records the upstream and generated SHA256 values. Updater x86 integration tests are excluded from qualification.

## Windows build configuration repair

The first compilation attempt completed 612 steps, then a TypeScript definition action failed with `ValueError: path is on mount 'C:', start on mount 'T:'`. The native TypeScript compiler canonicalized the SUBST workspace path to its physical drive, while the Python validator retained the mapped drive.

The pinned source provides the supported `use_typescript_go` GN option. The [Windows release arguments](../engine/releases/155.0.8059.80/args-windows-x64.gn) select `false` to use the upstream JavaScript compiler in this workspace. Rerunning the exact failed definition action with that compiler succeeded, including dependency validation. No TypeScript source, validation rule or browser C++ file was changed by this repair.

The incremental build was resumed with the verified three-patch series and regenerated build files. Completed output was preserved. The initial graph contains approximately 80,000 tasks; counts can change as Siso evaluates the graph and are not a wall-clock estimate.

## Progress and continuation

The visible PowerShell pipeline uses six local workers. Its stage headers and native output are appended immediately to the log, and Python output is unbuffered. The short-path drive mapping is restored only after checking the owned checkout marker. The historical 146 runtime and its separate candidate source remain untouched.

Inspect actual processes and current stage/log before a restart. Preserve an active build. If compilation fails, retain its first diagnostic and resume incrementally after repairing that specific failure. After linking, run the identity/seed, Python, local WebRTC and driver checks before changing any release qualification. Graphics, broader routing, platform, detector and production gates remain unqualified.
