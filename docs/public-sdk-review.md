# Public SDK review

Reference: CloakHQ/CloakBrowser commit `160f56da85860e89f0e7d9bfdc80266b984057d5`, cloned from the public repository on 14 October 2026. This review concerns published wrapper code. CloakHQ's proprietary Chromium patch implementation is not available in this checkout.

## Review scope

Source inspection covered the core Python launch/profile paths, JavaScript Playwright option/context builders, the Puppeteer launch/profile paths, argument precedence, proxy parsing, persistent seed publication, version-dependent defaults, GeoIP resolution, binary signature/version verification, and selected input/actionability and regression-test code. It is a scoped architecture/API review, not a line-by-line audit of every file or an execution of the reference SDK. CLI, licensing, DRM and every input method are not comprehensively audited.

Sources:

- `cloakbrowser/browser.py`, `config.py`, `download.py`, `geoip.py`, `human/patch.py`.
- `js/src/playwright.ts`, `puppeteer.ts`, `args.ts`, `proxy.ts`, `profile-seed.ts`, `config.ts`, `download.ts`, `geoip.ts`, `human/engine.ts`, `human/config.ts`.
- Selected `tests/test_extension_loading.py` and `tests/test_profile_seed.py` coverage.

## Findings and resulting requirements

| Observation in the reference | Implication for our project |
|---|---|
| Browser version/release channel and platform select binaries and feature gates | Keep exact engine revisions separate from user-agent/platform settings; record capability support per release |
| Python and JS provide launch, context and persistent-profile APIs; JS has a distinct Puppeteer adapter | Validate return types and lifecycle separately for every driver; CDP attachment alone does not establish Puppeteer SDK parity |
| Argument builder resolves duplicate switches and gives typed settings a defined precedence | Define and test argument precedence consistently in both languages; reject conflicting lifecycle switches |
| Viewport defaults depend on headed mode and engine support | Test actual geometry; a blanket viewport default can cause differences between launch methods |
| SOCKS credentials use native engine switches and feature-gated HTTP inline authentication | Do not relabel Playwright authentication as native support; add native proxy fixture tests |
| Browser-level proxy flags do not automatically configure Playwright's request client | Document/test browser traffic and API request traffic independently |
| Persistent seeds use exclusive publication and account for concurrent first launches | Fixed our empty-file publication race using a fully written/synced temporary file and atomic non-overwriting hard link; 48 concurrent callers pass in each language |
| Humanization covers page/frame/locator/element-handle actions with deadlines, actionability and hit-target checks | Our current explicit helpers and partial JS wrapping cover a smaller API surface; add cancellation and frame coverage |
| Some reference extension tests inspect mocked launch arguments | Add a real extension execution test before claiming custom-engine extension support |
| Official downloads verify an Ed25519 signature, bind the manifest to the requested version, then verify archive hashes | Future release downloads need a pinned trust root and version binding; a same-origin hash alone is insufficient |
| GeoIP resolution has a deadline, explicit override precedence and optional database dependency | Keep it opt-in with bounded network work and clear errors; currently unsupported in our SDK |

## Validation performed in our project

The compatibility fixture tests navigation, DOM input, iframe access, storage retained across reload, observed browser values and protocol access. On stock Chrome `155.0.8059.40`, Windows x64, all ten checks passed: JS Playwright SDK, JS Playwright CDP, Puppeteer CDP, Python Playwright, and Selenium/ChromeDriver, each headed and headless. See [baseline summary](driver-baseline-summary.json) for recorded versions and outcomes. Raw local observations are excluded from the public repository.

These results validate the local test harness and the current SDK paths on stock Chrome. Separate iteration-2 evidence now qualifies the same ten smoke paths and the documented identity/seed checks on our custom Windows 146 integration binary. See [custom-engine summary](engine-validation-summary.json). These checks do not qualify native Linux/macOS, arbitrary library versions, all Playwright features, or third-party framework integrations. The reference examples remain an inventory until executed independently.

The [iteration-3 checkpoint](iteration-03.md) adds a Puppeteer launch/profile adapter with real headed/headless historical-engine checks for explicit actionability, per-call input settings, cancellation and cleanup. It does not establish complete reference SDK parity; popup/context/frame coverage, authenticated proxy support and locale/timezone integration remain pending.

## Public references

- [Pinned public repository](https://github.com/CloakHQ/CloakBrowser/tree/160f56da85860e89f0e7d9bfdc80266b984057d5)
- [Pinned binary license](https://github.com/CloakHQ/CloakBrowser/blob/160f56da85860e89f0e7d9bfdc80266b984057d5/BINARY-LICENSE.md)
- [Playwright CDP attachment](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)
- [Puppeteer attachment](https://pptr.dev/api/puppeteer.puppeteer.connect)
- [Selenium Chrome options](https://www.selenium.dev/documentation/webdriver/browsers/chrome/)
