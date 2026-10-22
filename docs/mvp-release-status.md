# MVP release gate

The user authorizes publication once the requested behavior is implemented and qualified. Registry accounts have been created. This file tracks unfinished requirements rather than declaring the current SDK checkpoint to be the complete MVP.

| Requested capability | Current evidence / remaining gate |
| --- | --- |
| Source-patched Chromium | Five-patch 155 series verified; full compilation/linking is active |
| Headed and headless operation | Historical Windows integration evidence exists; rerun all gates on the finished five-patch 155 binary |
| Playwright, Python, Puppeteer/CDP, Selenium | Adapters and ten both-mode driver checks exist; new-runtime compatibility is pending |
| Native timezone/locale | Native source and standalone checks pass; document/frame/worker/HTTP/DST browser fixture is pending |
| Fonts and native hardware defaults | Additive Windows font source and standalone checks pass; native Ahem browser gate pending. Broader rendering/font/GPU consistency remains unqualified |
| Separate font installation | Ten unmodified Noto faces packaged for npm/Python with identical bytes and licenses; isolated installation passes. Both-mode real native rendering is queued after main pipeline qualification; broader Linux reference package recipe remains untested |
| Configurable desktop identity | Existing native platform identity series; new-runtime consistency and wider rendering behavior remain to qualify |
| Paced mouse/keyboard/scroll and actionability | SDK helpers exist with historical local evidence; new-runtime checks and broader method coverage remain |
| Persistent profiles | Seed/storage lifecycle exists; new-runtime profile, locking and isolation tests remain required |
| Extensions | SDK argument forwarding exists; extension behavior needs a local owned fixture on the finished runtime |
| HTTP proxy credentials | Playwright authentication adapter exists; native inline-auth network patch and owned proxy routing tests remain unfinished |
| Authenticated SOCKS5, UDP ASSOCIATE and HTTP3 | Native transport work remains unfinished; unsupported SDK options fail explicitly |
| GeoIP timezone/locale | Automatic resolver remains unfinished; manual native/context settings are separate implemented paths |
| WebRTC privacy policies | Stable native policy is written; local STUN gate pending. Broader IPv6/TURN/proxy routing remains unfinished |
| Canvas/audio/WebGL/screen/network policies | Broad earlier requests remain future, independently specified native work; no 87-patch or reference-product parity claim |
| npm and pip installation | SDK packages, entry points, shared cache and verified runtime installer implemented; isolated package checks pass. Registry publication and a qualified runtime asset remain pending |
| Linux/macOS native products | No qualified native artifacts. SDK cache paths/CI on those hosts do not establish native support |
| Authorized E2E automation-specific consistency | Investigate reproducible differences using driver/native/manual controls after initial runtime tests; universal detector outcomes cannot be guaranteed |

CAPTCHA solving/bypass is outside the user's clarified scope. A source patch count, reference example, or compatibility pass does not itself establish third-party detector classification.

The user also requests native fixes for reproducible browser-consistency failures, rather than JS/Python property overrides: use Chromium C++ for engine behavior and ChromeDriver changes for defects in WebDriver handling. SDK package/install changes remain ordinary client code. Requested provider coverage includes Akamai, hCaptcha, reCAPTCHA, DataDome, AWS WAF and Cloudflare; none has a measured five-patch result yet. Supported provider test keys/configurations establish controlled E2E behavior, not a guaranteed production classification or universal 100% acceptance.

Finish and preserve the active build first. Record actual both-mode results, repair the first reproducible failure incrementally, then choose the next ready native/SDK iteration. Follow [release instructions](releasing.md) for artifact completeness, notices, catalog checksums, registry authentication and publication. Publishing source progress is distinct from announcing a completed MVP or a production browser release.
