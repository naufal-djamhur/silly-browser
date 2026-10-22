# Native timezone, locale and Windows fonts — 23 October 2026

Two independent C++ patches are implemented for the pinned **155.0.8059.80** source, increasing its ordered series from three to five. They are applied to the stopped checkout and pass exact-series verification. **The full browser build remains stopped.** No linked 155 runtime, detector result or CloakBrowser parity is qualified by this checkpoint.

## Native configuration

| Flag | Implemented source behavior | Scope |
| --- | --- | --- |
| `--custom-browser-timezone=Europe/Paris` | Validates and canonicalizes through the selected Chromium ICU data; sets the process ICU timezone before browser execution; routes the default to child processes and preserves it across host timezone notifications | Explicit process default. ICU system timezone identifiers only; arbitrary GMT offsets are rejected |
| `--custom-browser-locale=fr-FR` | Requires a complete BCP 47 tag; canonicalizes it; initializes ICU and the language hint, renderer preferences, worker accept-language routing and profile HTTP language generation | Explicit process default. Managed language preferences remain authoritative. UI resource packs may select a fallback; they are not added by this patch |
| `--custom-browser-fonts-dir=C:\TestFonts` | Validates trusted local font files with DirectWrite; adds them before the system font set in the Windows font manager and browser DirectWrite proxy collection | Windows only; additive collection with system fallback. No font installation, OS spoofing or replacement of host fonts. Restart required for directory changes |

With no flags, these paths retain host defaults. Existing context/DevTools emulation remains a separate layer; these native switches are not a per-context configuration API. Profile preferences are not persistently rewritten by these native defaults.

The timezone controller retains its existing DevTools override ownership and restoration behavior. Host-change handling treats the configured native zone as the effective process default rather than overwriting an active DevTools override. Managed-policy and host-notification behavior are source-reviewed but require runtime tests after linking.

The Windows font implementation covers both the modern **FontDataService** font-manager path and the older **DirectWrite proxy** path, including its collection-based local-name lookup. Sandboxed renderer access continues to use existing font brokers/file handles. It does not grant renderers arbitrary directory access or disable the sandbox. OS-backed Local Font Access enumeration, browser UI font metadata, duplicate-family precedence, non-Latin fallback and every rendering API are not qualified here.

Font directories must be on a local fixed drive and absolute. Enumeration is nonrecursive and deterministic. Reparse points in the directory chain or selected font files are rejected. Only TTF, OTF and TTC files are selected; other ordinary files are ignored. Limits are 256 selected files, 64 MiB per file, 512 MiB total and 64 faces per file. Empty, unsupported and corrupt collections are rejected. These are explicit product limits, not limits inferred from CloakBrowser.

The engine-info handshake now runs after ICU/configuration validation, reports five source patches and exposes `native-timezone` and `native-locale`; Windows additionally reports `font-directory-windows`. Its integration-validated field remains false. A capability identifies implementation availability, not completed runtime qualification.

## Source and validation

- `0004-native-locale-timezone.patch` adds the ICU policy header, startup initialization, language routing and timezone-monitor integration.
- `0005-windows-font-directory.patch` adds bounded DirectWrite validation and both Windows font collection integration paths.
- Stable patch 1's decimal seed parser now uses checked multiply/add rather than unsafe pointer arithmetic. Chromium's unsafe-buffer diagnostics exposed the old implementation during this iteration. The replacement preserves uint64 limits and has a native boundary regression. The separate legacy experimental series was not changed.

Three standalone C++ executables **compiled and passed**: native ICU locale/timezone/malformed-input/DST checks, Windows font-directory/DirectWrite-format checks using Ahem plus a corrupt font, and the bounded seed parser. The policy tests use the selected checkout's ICU data and existing ICU/libc++ build artifacts. They do not compile or execute Chromium itself. The Ahem fixture's identity and helper hashes are retained in the [sanitized results](native-environment-fonts-20261023.json).

| Chromium integration check | Result |
| --- | --- |
| Renderer preference language path | Full translation-unit syntax passed |
| Profile network language path | Full translation-unit syntax passed |
| Blink timezone controller | Full translation-unit syntax passed |
| Device timezone monitor | Full translation-unit syntax passed |
| Windows graphics DirectWrite path | Full translation-unit syntax passed |
| Browser DirectWrite proxy path | Full translation-unit syntax passed |
| Main delegate | Exact added startup body passes against real Chromium declarations. Full translation unit is blocked on the not-yet-generated `chrome/common/media/webrtc_logging.mojom.h` |
| Chrome browser client | Exact language-routing body passes against real Chromium declarations. Full translation unit is blocked on the not-yet-generated `chrome/common/renderer_configuration.mojom.h` |
| Exact applied series / patch digests | Verified against all five ordered patches and pinned upstream files |
| New both-mode native browser fixture | Written and syntax-checked; actual runtime execution deferred |

No generated headers were fabricated and no diagnostics were disabled to make these checks pass. The two blocked translation units remain pending the ordinary build dependency graph. GN files were formatted, but GN regeneration and the full compiler pipeline were not started. Existing completed build output is preserved.

The workspace continuation runner was updated, without executing it, to require the new native-environment and context gates after linking. It prepares an owned Ahem-only directory and fresh reports, so a future integration-success status cannot silently omit these native feature checks.

## Reproduction and next gates

The standalone runner requires Windows, an installed `vcvars64.bat` and the already-existing ICU/libc++ artifacts in the selected checkout. Use a new output directory:

```powershell
python build/test_native_policies.py --source PATH_TO_155_SRC --vcvars PATH_TO_VCVARS64_BAT --output NEW_NATIVE_TEST_DIRECTORY
```

It never invokes GN, Ninja, Siso or the browser, and will stop rather than build missing prerequisites. It checks that tested policy headers exactly match their patched-checkout copies. Font binaries and test executables remain local; no commercial font files are distributed.

After explicit build continuation, regenerate through the normal incremental pipeline, compile/link the actual five-patch engine and run its configured identity/driver/WebRTC gates. Then run:

```powershell
$env:CUSTOM_BROWSER_EXECUTABLE = 'PATH_TO_FINISHED_155_RUNTIME\chrome.exe'
$env:CUSTOM_BROWSER_RELEASE = '155.0.8059.80'
$env:CUSTOM_BROWSER_FONT_TEST_DIR = 'LOCAL_DIRECTORY_CONTAINING_Ahem.ttf'
$env:CUSTOM_NATIVE_ENV_REPORT = 'NEW_REPORT_DIRECTORY\native-environment.json'
npm run test:native-environment
```

The fixture supplies native command-line flags and deliberately supplies no SDK locale/timezone emulation. It asserts document, iframe, HTTP, dedicated-worker, shared-worker and service-worker agreement in headed and headless modes, including DST. When Ahem is supplied, it also requires a successful native `local()` font load and its expected canvas advance width. It records executable/DLL hashes and marks incomplete runs accordingly. Font rendering is not qualified if the optional font fixture was not requested. Workers, font loading and these complete browser results remain unmeasured until that run.

Next targeted cases are invalid CLI configurations, policy precedence, host timezone changes, profile reopen/renderer reuse, alternate locales, font-cache restart, duplicate families, fallback scripts and OS-backed enumeration. The existing CloakBrowser examples remain pinned reference measurements; these C++ changes alone establish no classification or score outcome.
