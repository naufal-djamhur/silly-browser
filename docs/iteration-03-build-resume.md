# Chromium 155 build resume — 22 October 2026

The pinned **155.0.8059.80** Windows x64 build has resumed native compilation. Dependency synchronization, build hooks, ordered patch application, exact three-patch verification and GN generation have passed. There is no completed stable binary or stable browser-validation claim yet.

## Dependency repair

The earlier path-only `custom_deps=None` setting did not exclude the CIPD updater package: the actual retry still registered it and failed under Windows Defender. Syntax validation alone had not established the exclusion's behavior.

The new [dependency generator](../build/prepare_browser_deps.py) reads `DEPS` directly from the locked Git commit, checks that the tracked file has no local changes, and writes a separate browser-only dependency manifest outside the source tree. Only the value for `src/third_party/updater/chrome_win_x86/cipd` becomes `None`; every other dependency and setting is preserved. This is prebuilt x86 updater-test data, outside the selected x64 browser target. The original tracked DEPS file is unchanged. No blocked artifact was restored/executed and no antivirus setting was changed.

The root `.gclient` selects the generated manifest through its `deps_file` option. Recursive dependencies retain their normal DEPS files through gclient's standard fallback. Actual synchronization then passed, followed by all build hooks. Two [scope/guard tests](../tests/browser_deps_test.py) pass, checking preservation of other entries and rejection of ambiguous or unexpected package definitions. The [dependency profile](../engine/releases/155.0.8059.80/dependency-profile.json) records the upstream and generated SHA256 values. Updater x86 integration tests are excluded from qualification.

## Windows build configuration repair

The first compilation attempt completed 612 steps, then a TypeScript definition action failed with `ValueError: path is on mount 'C:', start on mount 'T:'`. The native TypeScript compiler canonicalized the SUBST workspace path to its physical drive, while the Python validator retained the mapped drive.

An initial workaround selected the upstream JavaScript TypeScript compiler and passed the failed definition action. The next incremental run exposed the same mapped-drive mismatch in Dawn's Python generator. A same-drive junction also failed because Go resolved the module directory and package path differently. These observations established that every build tool must use the physical checkout path consistently.

The pipeline now uses the original physical Windows checkout path for its working directory, GN generation and output directory. No checkout or completed output was moved or deleted. The exact Dawn generator action and the original TypeScript action both passed from that path, including Chromium's default Go TypeScript compiler. The temporary `use_typescript_go=false` workaround was removed from the [Windows release arguments](../engine/releases/155.0.8059.80/args-windows-x64.gn). No TypeScript/Dawn source, validation rule or browser C++ file was changed by this repair.

The incremental build was resumed with the verified three-patch series and regenerated build files. Completed output was preserved. The initial graph contains approximately 80,000 tasks; counts can change as Siso evaluates the graph and are not a wall-clock estimate.

## Progress and continuation

The visible PowerShell pipeline uses six local workers. Its stage headers and native output are appended immediately to the log, and Python output is unbuffered. The pipeline verifies the physical checkout's owned marker and uses no mapped-drive or junction alias. The historical 146 runtime and its separate candidate source remain untouched. The resumed physical-path invocation has advanced past 2,500 build actions with active compiler workers; this is progress evidence, not a completed-build result.

Inspect actual processes and current stage/log before a restart. Preserve an active build. If compilation fails, retain its first diagnostic and resume incrementally after repairing that specific failure. After linking, run the identity/seed, Python, local WebRTC and driver checks before changing any release qualification. Graphics, broader routing, platform, detector and production gates remain unqualified.
