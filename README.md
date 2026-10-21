# silly-browser

An independent source-patched Chromium project with Python and JavaScript control APIs and a reproducible detector benchmark harness.

**Current status: the Windows x64 Chromium 146 integration binary compiled and passed local validation.** Two applied C++ patches provide seed infrastructure and desktop web identity settings. Twenty-eight JavaScript engine checks, five Python custom-engine checks and ten custom-engine driver smoke checks pass. See [measured evidence](docs/engine-validation-summary.json).

Chromium 146 is a historical integration build. Rendering, graphics, network, WebRTC and input engine changes remain outstanding; no current production release or broad version range is qualified.

The separate Chromium **155.0.8059.80** build has passed dependency sync, hooks and exact three-patch application/verification; native Windows compilation is in progress. There is no completed 155 binary qualification yet. The Puppeteer launch adapter passes local headed/headless checks on the preserved historical binary. See the [latest build checkpoint](docs/iteration-03-build-resume.md).

The planned scope includes multiple Chromium revisions, a public SDK review and driver compatibility. [Completion tracker](docs/engine-roadmap.md), [public SDK review](docs/public-sdk-review.md), and [version pins](engine/versions.json) distinguish planned releases from validated support. No custom version is advertised as supported yet.

To continue development, read the [implementation plan](docs/implementation-plan.md), [session handoff](docs/session-handoff.md), and [ECC command guide](docs/orchestration.md). The plan defines 26 iterations with dependencies and acceptance criteria. The current local build/test pipeline does not execute those future iterations automatically.

Ten local Windows checks pass on stock Chrome 155: JS Playwright SDK, JS Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver, each headed and headless. See [driver checks](compatibility/README.md) and the [baseline summary](docs/driver-baseline-summary.json). The same ten driver paths also passed on the custom Chromium 146 binary; see [custom-engine evidence](docs/engine-validation-summary.json). Raw captures and local machine/build reports are excluded from this repository.

## What works now

- JavaScript launches, temporary profile contexts, persistent contexts, per-profile seeds, sandbox-enabled launches, and explicit engine/baseline separation.
- Python sync and async launches with the same profile and seed lifecycle.
- Optional curved mouse movement, paced keyboard typing, incremental scrolling, and per-call settings.
- Humanized click helpers wait for actionability and revalidate before dispatch. JavaScript's supported page locator click methods also use the scheduler. Python uses explicit `human_click` and `human_type` helpers.
- HTTP proxy credentials are parsed separately from the server address and handled through Playwright's existing authentication support. This is not a new native network-layer patch.
- Benchmark screenshots, raw page text, structured verdicts, verified demo scores, engine hash/version, and environment metadata.
- A pinned inventory of all 17 reference example files, with integrations distinguished from detector tests.

## Run a baseline

```powershell
npm ci
npm run benchmark -- --executable "C:\Program Files\Google\Chrome\Application\chrome.exe" --engine-mode baseline --target fingerprint-scan
npm run benchmark -- --executable "C:\Program Files\Google\Chrome\Application\chrome.exe" --engine-mode baseline --target recaptcha-v3
```

Use `--headed` for a visible run and `--humanize` for the supported input scheduler. `--repetitions 3` requests independent temporary profiles per repetition. Thresholds of 20/100 and 0.7/1 are provisional project targets, not official site thresholds. Lower Fingerprint Scan bot-risk scores and higher reCAPTCHA scores are the desired directions. Missing or uncollected data never counts as passing.

The runner does not automatically interact with every behavioral detector. A page capture is not a behavioral pass. CreepJS, Incolumitas and BrowserScan currently retain evidence for manual review until validated verdict adapters exist. A detector result applies to its recorded test/environment only.

The reCAPTCHA demo itself warns that its scores do not reflect production traffic. One 0.9 baseline observation is not proof of fingerprint resistance. Repeated runs may fail to produce a score.

## JavaScript API

```javascript
import {launchContext, launchPersistentContext, buildLaunchOptions, humanizeBrowser} from './sdk/js/index.mjs';
const context = await launchContext({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  engineMode: 'baseline',
  headless: true,
  humanize: true,
  humanConfig: {durationMs: 300, typingDelayMs: 55, scrollSteps: 8, seed: 123}
});
try {
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.mouse.move(200, 150, {humanConfig: {durationMs: 200}});
} finally {await context.close();}
```

For persistent state use `launchPersistentContext('profiles/my-profile', options)`. Supply a decimal string for large uint64 seeds. Extensions use `extensionPaths` with a profile context; plain `launch()` deliberately rejects extension paths rather than silently opening incognito contexts without extensions. Extension behavior on our future custom binary is not yet validated. Frame locators, raw input commands, drag, touch, and every Playwright method are not universally wrapped.

`launch()` returns a Playwright Browser; `launchContext()` returns a profile-backed BrowserContext with temporary-directory cleanup. Custom mode is the default and requires the engine handshake; stock Chrome is allowed only when explicitly labeled baseline. No bundled/downloaded binary is misrepresented as our engine.

### Puppeteer adapter

```javascript
import {launchPuppeteer, launchPuppeteerPersistent} from './sdk/js/index.mjs';
const browser = await launchPuppeteer({executablePath: 'PATH_TO_CUSTOM_CHROME.exe', humanize: true});
try {
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.mouse.move(200, 150, {humanConfig: {durationMs: 200}});
} finally {await browser.close();}
```

`launchPuppeteerPersistent(profileDirectory, options)` preserves profile data and seeds. Explicit `page.humanClick(selector, options)` and `page.humanType(selector, text, options)` wait for an actionable target. Mouse/keyboard helpers accept per-call `humanConfig` and an AbortSignal; `mouse.wheel` retains Puppeteer's object argument. Popup pages, separate contexts and nested frames are not automatically wrapped. Authenticated proxies and locale/timezone options fail explicitly in this adapter until qualified.

`webrtcPolicy` (Python: `webrtc_policy`) defaults to `native`. Other standard IP-handling policies require the explicit `webrtc-policy` engine capability. The historical binary rejects them; the stable implementation awaits compilation and routing validation.

## Python API

```powershell
py -m pip install -e sdk/python
```

```python
from custom_browser import launch_context
context = launch_context(
    executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    engine_mode='baseline', headless=True, humanize=True,
    human_config={'duration_ms': 300, 'typing_delay_ms': 55},
)
try:
    page = context.new_page()
    page.goto('https://example.com')
    page.mouse.move(200, 150, human_config={'duration_ms': 200})
finally:
    context.close()
```

Use `page.human_click(locator, human_config=...)` or `page.human_type(locator, text, human_config=...)` for actionability and typing. Async equivalents are `launch_async`, `launch_context_async`, and `launch_persistent_context_async`. Native Playwright locator methods remain unchanged in Python. Explicit cancellation handles are not implemented yet; closing a page/context interrupts browser commands.

## Native build workflow

1. Install the required SDK and debugger update, then run `build/preflight.ps1`.
2. Put depot_tools on PATH and use `build/checkout.cmd` from an empty, short workspace path. This performs a substantial Chromium source and dependency download.
3. Apply the verified patch series with `python build/apply_to_checkout.py CHROMIUM_SRC`.
4. Put `build/args.gn` into the chosen Chromium output directory, run `gn gen out/CustomBrowser`, then `autoninja -C out/CustomBrowser chrome` from the source checkout.
5. Verify `chrome.exe --headless --custom-browser-engine-info` and run actual browser integration tests before publishing a custom artifact.

The 146 lock is a historical reference anchor, not a current production recommendation. Rebase onto a current supported revision before shipping. Do not turn off sandboxing to make tests pass.

For the pinned 155 Windows x64 browser-only dependency profile, run `python build/prepare_browser_deps.py CHROMIUM_SRC --release 155.0.8059.80` after checking out the main source. In that checkout's `.gclient`, select `deps_file: '../.silly-browser-155.0.8059.80.DEPS'` instead of `DEPS`. This omits only unused prebuilt x86 updater-test data; path-only `custom_deps` did not exclude the CIPD package. Keep antivirus enabled. Use the physical Windows checkout path consistently for the working directory, GN and output path: mapped-drive and junction aliases caused TypeScript/Dawn generator failures. The [release-specific arguments](engine/releases/155.0.8059.80/args-windows-x64.gn) retain Chromium's default TypeScript compiler. See [repair evidence and limitations](docs/iteration-03-build-resume.md).

## Verification

```powershell
$env:TEST_CHROMIUM_EXECUTABLE='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test
py tests/python_browser_test.py
# Set this to your actual custom build before running engine qualification:
$env:CUSTOM_BROWSER_EXECUTABLE="PATH_TO_BUILT_CHROME.exe"
npm run test:engine
py tests/python_custom_engine_test.py
py build/verify_patches.py --workspace PATH_TO_EMPTY_VERIFICATION_DIRECTORY
# Select the separate stable source series explicitly:
py build/verify_patches.py --release 155.0.8059.80 --workspace ANOTHER_EMPTY_DIRECTORY
npm run test:puppeteer
```

Python tests require the installed SDK package. Native parser tests compile `tests/seed_policy_test.cc` with C++17; they do not compile Chromium. Browser tests use a local fixture to exercise input, disabled-target waiting, storage, cookies, profile seeds, and cleanup. The report distinguishes these checks from detector tests.

## Remaining engine work

Desktop platform presets are compiled and locally validated on the Windows x64 integration binary. Custom-mode SDK options map `platform` and `platformVersion` (Python: `platform_version`) to source-level settings; baseline mode rejects identity overrides. Synthetic preset versions default to Windows `13.0.0`, macOS `15.0.0`, and blank Linux Client Hints platform version. Native mode retains the actual engine defaults. Fonts, GPU, and network behavior are not changed by these identity settings.

Canvas/audio/font/graphics/display consistency, native HTTP credential support, authenticated SOCKS5, UDP ASSOCIATE and HTTP3 transport, WebRTC candidate/routing policies, GeoIP, network exposure policies, and CDP input changes are not implemented. Corresponding unsupported SDK options fail explicitly. No 87-patch claim or universal detector-pass claim is made.

AI/MCP adapters, expanded custom-engine Selenium checks, undetected-chromedriver integration runs, Linux/macOS native builds, artifact signing, release downloads, and integration dependency suites remain outstanding. See `docs/reference-examples.json` for the full reference coverage inventory.

The project uses upstream Chromium and our own patches. CloakBrowser remains a benchmark reference, not the engine dependency or a copied proprietary patch set.
