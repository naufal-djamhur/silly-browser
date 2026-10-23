# MVP release gate

The user authorizes publication once the requested behavior is implemented and qualified. Registry accounts have been created. This file tracks unfinished requirements rather than declaring the current SDK checkpoint to be the complete MVP.

| Requested capability | Current evidence / remaining gate |
| --- | --- |
| Source-patched Chromium | Five-patch 155.0.8059.80 Windows x64 build compiles, links and passes [48 local checks](engine-validation-155.md) |
| Headed and headless operation | Local Windows 155 identity/configuration/font and driver gates pass in both modes |
| Playwright, Python, Puppeteer/CDP, Selenium | Ten driver routes pass on the completed Windows 155 runtime; broader driver operations remain separate |
| Native timezone/locale | Document/frame/worker/HTTP/DST and invalid-option native gates pass on Windows 155; managed policy/host-change behavior remains unqualified |
| Fonts and native hardware defaults | Native Ahem and ten-face Noto loading/metrics pass in both modes. Broader rendering/font/GPU consistency remains unqualified |
| Separate font installation | Identical licensed Noto data packages install successfully, and ten real faces load with expected metrics on Windows 155 in both modes; broader Linux reference recipe remains untested |
| Configurable desktop identity | Windows 155 document/header/worker identity checks pass; wider rendering/OS consistency remains unqualified |
| Paced mouse/keyboard/scroll and actionability | SDK helpers exist with historical local evidence; new-runtime checks and broader method coverage remain |
| Persistent profiles | Seed/storage and temporary/persistent context lifecycle checks pass on Windows 155; broader contention/interaction cases remain |
| Extensions | SDK argument forwarding exists; extension behavior needs a local owned fixture on the finished runtime |
| HTTP proxy credentials | Playwright authentication adapter exists; native inline-auth network patch and owned proxy routing tests remain unfinished |
| Authenticated SOCKS5, UDP ASSOCIATE and HTTP3 | Native transport work remains unfinished; unsupported SDK options fail explicitly |
| GeoIP timezone/locale | Automatic resolver remains unfinished; manual native/context settings are separate implemented paths |
| WebRTC privacy policies | Local STUN policy behavior passes on Windows 155 in both modes. Broader IPv6/TURN/proxy routing remains unfinished |
| Canvas/audio/WebGL/screen/network policies | Broad earlier requests remain future, independently specified native work; no 87-patch or reference-product parity claim |
| npm and pip installation | SDK packages, entry points, shared cache and verified runtime installer implemented; isolated package checks pass. Registry publication and a qualified runtime asset remain pending |
| Linux/macOS native products | No qualified native artifacts. SDK cache paths/CI on those hosts do not establish native support |
| Authorized E2E automation-specific consistency | Investigate reproducible differences using driver/native/manual controls after initial runtime tests; universal detector outcomes cannot be guaranteed |

CAPTCHA solving/bypass is outside the user's clarified scope. A source patch count, reference example, or compatibility pass does not itself establish third-party detector classification.

The user also requests native fixes for reproducible browser-consistency failures, rather than JS/Python property overrides: use Chromium C++ for engine behavior and ChromeDriver changes for defects in WebDriver handling. SDK package/install changes remain ordinary client code. Requested provider coverage includes Akamai, hCaptcha, reCAPTCHA, DataDome, AWS WAF and Cloudflare; none has a measured five-patch result yet. Supported provider test keys/configurations establish controlled E2E behavior, not a guaranteed production classification or universal 100% acceptance.

Preserve the completed Windows 155 runtime and its hash-bound results, then choose the next ready native/SDK iteration. Follow [release instructions](releasing.md) for artifact completeness, extracted-layout tests, notices, catalog checksums, registry authentication and publication. Publishing source progress is distinct from announcing a completed MVP or a production browser release.
