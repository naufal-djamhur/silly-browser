# MVP release gate

The user authorizes publication once the requested behavior is implemented and qualified. Registry accounts have been created. This file tracks unfinished requirements rather than declaring the current SDK checkpoint to be the complete MVP.

| Requested capability | Current evidence / remaining gate |
| --- | --- |
| Source-patched Chromium | Six-patch 155.0.8059.80 Windows x64 build passes [native HTTP proxy and 48 existing checks](native-http-proxy-155.md); native distribution and CDP source-revision metadata remain release gates |
| Headed and headless operation | [Exact-version upstream comparison](stock-comparison-155-patch6.md): 61 Node tests pass, including nine shared scenarios in all four engine/mode combinations and separate native configuration checks |
| Playwright, Python, Puppeteer/CDP, Selenium | All ten custom driver routes pass again alongside ten upstream-control routes on Windows 155; broader driver operations remain separate |
| Native timezone/locale | Document/frame/worker/HTTP/DST and invalid-option native gates pass on Windows 155; managed policy/host-change behavior remains unqualified |
| Fonts and native hardware defaults | Native Ahem and ten-face Noto loading/metrics pass in both modes. Broader rendering/font/GPU consistency remains unqualified |
| Separate font installation | Identical licensed Noto data packages install successfully, and ten real faces load with expected metrics on Windows 155 in both modes; broader Linux reference recipe remains untested |
| Configurable desktop identity | Windows 155 document/header/worker identity checks pass; wider rendering/OS consistency remains unqualified |
| Paced mouse/keyboard/scroll and actionability | SDK helpers exist with historical local evidence; new-runtime checks and broader method coverage remain |
| Persistent profiles | Seed/storage and temporary/persistent context lifecycle checks pass on Windows 155; broader contention/interaction cases remain |
| Extensions | SDK argument forwarding exists; extension behavior needs a local owned fixture on the finished runtime |
| HTTP proxy credentials | [Native HTTP Basic inline/private-file authentication](native-http-proxy-155.md) passes owned HTTP/CONNECT, bypass, denial and invalid-option checks in both modes; managed-policy integration, other proxy protocols/authentication schemes and per-context native credentials remain unqualified |
| Authenticated SOCKS5, UDP ASSOCIATE and HTTP3 | Native transport work remains unfinished; unsupported SDK options fail explicitly |
| GeoIP timezone/locale | Automatic resolver remains unfinished; manual native/context settings are separate implemented paths |
| WebRTC privacy policies | Local STUN policy behavior passes on Windows 155 in both modes. Broader IPv6/TURN/proxy routing remains unfinished |
| Canvas/audio/WebGL/screen/network policies | Broad earlier requests remain future, independently specified native work; no 87-patch or reference-product parity claim |
| npm and pip installation | SDK packages, entry points, shared cache and verified runtime installer implemented; isolated package checks pass. Registry publication and a qualified runtime asset remain pending |
| Linux/macOS native products | No qualified native artifacts. SDK cache paths/CI on those hosts do not establish native support |
| Authorized E2E automation-specific consistency | [Fresh detector and native observation controls](detector-comparison-155-146.md) reproduce identical failing classifications on Silly/upstream 155 and no functional defect in the tested scope; saved free CloakBrowser 146 comparison is version-confounded. Universal detector outcomes and production provider traffic remain unqualified |

CAPTCHA solving/bypass is outside the user's clarified scope. A source patch count, reference example, or compatibility pass does not itself establish third-party detector classification.

The user also requests native fixes for reproducible browser-consistency failures, rather than JS/Python property overrides: use Chromium C++ for engine behavior and ChromeDriver changes for defects in WebDriver handling. SDK package/install changes remain ordinary client code. Requested provider coverage includes Akamai, hCaptcha, reCAPTCHA, DataDome, AWS WAF and Cloudflare. The [five-patch 155 reference measurements](reference-tests-155.md) now include one verified public reCAPTCHA demo score of 0.9 in each mode; the overall detector benchmark fails. Those demo results do not qualify production provider traffic, and the other named provider environments remain unmeasured. Supported provider test keys/configurations establish controlled E2E behavior, not a guaranteed production classification or universal 100% acceptance.

Preserve the completed Windows 155 runtime and its hash-bound results, then choose the next ready native/SDK iteration. Follow [release instructions](releasing.md) for artifact completeness, extracted-layout tests, notices, catalog checksums, registry authentication and publication. Publishing source progress is distinct from announcing a completed MVP or a production browser release.
