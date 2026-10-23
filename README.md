# silly-browser

An open-source, source-patched Chromium project for browser automation and E2E testing, with JavaScript and Python SDKs. Original project code is [MIT-licensed](LICENSE); Chromium and dependencies retain their [upstream licenses](NOTICE).

**Experimental:** the six-patch Chromium **155.0.8059.80 Windows x64** build passes [native HTTP proxy authentication tests and 48 existing integration checks](docs/native-http-proxy-155.md), including headed/headless drivers and native locale/timezone/fonts. The [five-patch qualification](docs/engine-validation-155.md) remains preserved. There is no published native download or npm/PyPI release yet. Native distribution qualification and the complete MVP are still pending.

[Patch-six reference example measurements](docs/reference-tests-155-patch6.md) are available for both modes, including exact reported failing checks. Navigation and profile persistence pass; the public reCAPTCHA demo returned 0.9 per mode. Fingerprint Scan/CreepJS and the detector suite still fail their criteria. Local functional/API controls establish no native defect in the tested scope; no overall benchmark pass or reference-product parity is claimed.

[Local functional parity](docs/functional-parity-155.md) also passes eight paired scenarios covering layout/fonts, graphics/audio, editing, scrolling, popups, storage and worker configuration. No native defect was reproduced in that bounded inspection.

## Install the SDK today

Requires Node.js **22.12+** or Python **3.10+**, plus Git for these source installs:

```sh
# JavaScript
npm install github:naufal-djamhur/silly-browser
npx silly-browser status

# Python
python -m pip install "git+https://github.com/naufal-djamhur/silly-browser.git#subdirectory=sdk/python"
python -m silly_browser status
```

After registry publication, the install commands will be `npm install silly-browser` and `python -m pip install silly-browser`. Registry authentication and publication are still pending; those registry commands do not work yet.

### Optional fonts

Fonts are a separate [silly-browser-fonts package](packages/fonts/README.md), containing ten unmodified OFL-licensed Noto TTF faces with provenance and checksums. After publication, add it with `npm install silly-browser-fonts` or `python -m pip install silly-browser-fonts` (Python also supports `silly-browser[fonts]`). From a source checkout it can already be installed with `npm install ./packages/fonts` and `python -m pip install ./packages/fonts`.

Use `launch({fontPack: 'noto-core'})` in JS or `launch(font_pack="noto-core")` in Python. For your own licensed font files, use `fontDirectory` / `font_directory`. These options select the native font directory; they do not inject browser properties. The Windows 155 loader passes local Ahem and ten-face Noto checks in both modes. No Linux/macOS font-loader support is implied by installing the font files there.

Windows retains its real system fonts. For Linux, the font package README includes the same eight-package font selection used in CloakBrowser's public Dockerfile. Noto core alone is a smaller optional pack; full rendering equivalence remains unmeasured. See [the font comparison](docs/font-compatibility.md).

## Launch

```javascript
import {launch} from 'silly-browser';

// First launch installs the pinned runtime once a qualified release is published.
// Until then, supply executablePath: 'PATH_TO_YOUR_BUILT_CHROME'.
const browser = await launch({headless: true});
try {
  const page = await browser.newPage();
  await page.goto('https://example.com');
} finally {
  await browser.close();
}
```

```python
from silly_browser import launch

# Until the native release is published, supply executable_path="PATH_TO_YOUR_BUILT_CHROME".
browser = launch(headless=True)
try:
    page = browser.new_page()
    page.goto("https://example.com")
finally:
    browser.close()
```

Use `headless: false` / `headless=False` for a visible browser. The existing `custom_browser` Python import remains supported. JavaScript `launchContext` and Python `launch_context` create owned temporary profile contexts; their persistent-context variants retain an explicitly selected profile. See [the API/development guide](docs/development-guide.md) for context settings, async Python, Puppeteer, proxies, extensions and current limits. The Puppeteer adapter additionally requires `npm install puppeteer-core`.

## Browser installation and configuration

SDK package installation and imports do not download or compile Chromium. An explicit install command or the first SDK launch installs an available, pinned native release into a shared user cache. Subsequent launches reuse the verified cache. JavaScript and Python use the same cache layout.

```sh
npx silly-browser install
npx silly-browser path
python -m silly_browser install
python -m silly_browser path
```

| Setting | Purpose |
| --- | --- |
| `executablePath` / `executable_path` | Explicit browser executable; takes precedence |
| `SILLY_BROWSER_EXECUTABLE_PATH` | Local build used when no API path is supplied |
| `SILLY_BROWSER_CACHE_DIR` | Override the shared runtime cache |
| `SILLY_BROWSER_REVISION` | Select a revision present in the SDK's bundled catalog |
| `SILLY_BROWSER_SKIP_DOWNLOAD=1` | Require an explicit executable or an already installed runtime |

Default caches are `%LOCALAPPDATA%\silly-browser\Cache` on Windows, `~/Library/Caches/silly-browser` on macOS, and `$XDG_CACHE_HOME/silly-browser` or `~/.cache/silly-browser` on Linux. No administrator access, system browser replacement or system font installation is required. The SDK's platform identity option is separate from the actual host/architecture used to select downloads.

The installer verifies archive and individual file SHA256 values, bounds downloads/extraction, rejects unsafe ZIP paths and symlinks, and uses an installation lock plus atomic publication. Metadata is pinned in the SDK package; there is no silent background browser update. Upgrade the SDK to obtain a newer catalog. **The catalog is intentionally empty until a native runtime passes qualification and is published.** An unavailable runtime produces an actionable error and never substitutes stock Chrome. Baseline testing requires an explicit executable and explicit baseline mode.

## Project status and development

Implemented SDK foundations include profile lifecycle, explicit context configuration, driver adapters and optional paced input helpers. The six-patch native source adds seed lifecycle, platform web identity, WebRTC policy, ICU timezone/locale defaults, additive Windows fonts and [HTTP Basic proxy credentials](docs/native-http-proxy-155.md). The exact Windows 155 build passes the measured local integration gates. Linux/macOS native artifacts, broader rendering/network work, signed releases and production support remain future work. No detector score or universal driver compatibility is guaranteed.

Read [CONTRIBUTING](CONTRIBUTING.md), [the security policy](SECURITY.md), [community guidelines](CODE_OF_CONDUCT.md), [the implementation plan](docs/implementation-plan.md), and [release instructions](docs/releasing.md). Lightweight CI checks SDKs and packages across Windows, Linux and macOS; native Chromium qualification is a separate build process.

The project is independent. CloakBrowser is a comparison reference, not an engine dependency or a redistributed proprietary patch set.
