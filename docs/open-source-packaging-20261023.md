# Open-source SDK and font package checkpoint

23 October 2026. Publication is authorized after qualification; these changes prepare installable packages while preserving the active five-patch Chromium 155 build. **No npm/PyPI package or native runtime has been published by this iteration.**

The JS `silly-browser` package and Python distribution of the same name now have public package metadata, entry points, MIT/Chromium notices, source-install instructions, contribution/security guidance and a lightweight three-OS CI workflow. Python exposes `silly_browser` and retains `custom_browser`. The optional Puppeteer adapter is also exported as `silly-browser/puppeteer`.

Both SDKs share the revision/host cache layout and an explicit install/first-launch installer. The shipped release catalog remains empty until a complete runtime passes qualification and is uploaded. ZIP downloads are restricted to the project's release URLs, checked against pinned archive/file digests, bounded during extraction, and published atomically under an install lock. Installing or importing a package does not compile or fetch Chromium. No stock-browser fallback masks an unavailable custom runtime.

## Separate fonts

`packages/fonts` builds the independent `silly-browser-fonts` npm and Python packages. One inventory pins ten unmodified Noto TTF faces to upstream commit `ffebf8c1ee449e544955a7e813c54f9b73848eac`, including sizes, SHA256 values, real font metadata and metric expectations. Font data totals 5,878,396 bytes. The font license is OFL-1.1; helper code is MIT. No proprietary OS fonts are included.

`fontPack: 'noto-core'` / `font_pack="noto-core"` resolves the installed package directory and passes it to the native Windows loader. A custom licensed directory is also supported. Conflicting configuration and engines missing the font capability fail explicitly. These are launch configuration options, not browser-property overrides.

The [reference comparison](font-compatibility.md) confirms that CloakBrowser uses host fonts and a broader eight-package Linux environment. Its package-selection recipe is included in the font package README. Noto core does not cover that full environment; Linux recipe execution, file equivalence and actual rendering remain unqualified. Windows retains its native system font fallback.

## Measured checks

- JavaScript SDK/installer/font suites: **23 passed, 3 skipped**. Skips are real-browser, historical-engine WebRTC and new native-font fixtures requiring explicit runtime configuration.
- Python selected lightweight suites: **21 passed** (8 SDK contract, 8 installer/cache, 3 font package, 2 release-catalog checks). The shared-cache test exercises JS-to-Python and Python-to-JS reuse without a second download.
- Six package artifacts built: npm SDK/fonts, Python SDK/fonts wheels and source distributions. **All four Python artifacts pass `twine check`.** Archive inspection confirms notices, absence of native binaries/private build evidence, and byte-identical inventoried fonts across all three font archives.
- Fresh npm and Python environments install the SDK independently of the optional fonts, report an unavailable runtime clearly, then install the font archive and verify all ten files. Installed SDK imports, CLI status, font-directory option mapping and the JS Puppeteer export pass.
- Ten packaged fonts pass standalone native DirectWrite acceptance; a corrupt font is rejected. **This is not a browser rendering result.**

An initial broad Python discovery also collected browser-only tests without `TEST_CHROMIUM_EXECUTABLE`; three tests errored on that missing precondition. The explicit lightweight suites above pass. Actual browser suites remain separate required native gates.

The new `npm run test:font-pack:engine` fixture loads each real local face and checks its advance width in both display modes, preserving baseline font observations and runtime hashes. A one-time workspace helper waits for the existing main pipeline's successful receipt before running it; it does not change the active runner, source or compiler. Failure of the main pipeline stops this additional qualification. No native-font result exists yet.

Exact local artifact digests and sizes are in [the sanitized package summary](open-source-packaging-20261023.json). CI results must be checked after this source checkpoint is pushed. Native linking, the main runtime/driver gates, packaged-font rendering, staged-runtime completeness and other [MVP requirements](mvp-release-status.md) still gate release. Registry account authentication/ownership remains to establish locally before publishing; do not put credentials in source or chat.
