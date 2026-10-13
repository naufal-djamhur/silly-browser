# Engine and SDK completion tracker

Project scope as of 14 October 2026: an independent Chromium engine, multiple Chromium revisions, public SDK review, and measured driver compatibility. The initial native build is a prerequisite, not product completion.

## Release lines

See `engine/versions.json` for exact revision pins. Chromium 146 is the historical integration build. Chromium 155 is a previous-major rebase target; the installed stock Chrome 155 only supplies harness evidence. Chromium 156 is the stable Windows target reported by Chromium Dash on 14 October 2026. No custom Chromium version is advertised as supported yet.

Every maintained revision needs a separate ordered patch series, clean checkout verification, build output, binary hash, feature report, and driver matrix. A user-agent override never selects an engine version. A release line becomes supported only after its actual binary qualifies. Security updates require rebasing and re-running these gates.

## Completion gates

| ID | Work | Current evidence/status | Required completion evidence |
|---|---|---|---|
| BUILD-01 | Windows native engine | Dependencies, source patching and build generation pass; compilation running | Successful build, engine handshake, exact binary version/hash |
| ENGINE-02 | Platform identity | C++ policy and patch application pass; browser integration pending | UA and Client Hints agree across HTTP, main page, frames and workers; native mode preserved |
| ENGINE-03 | Native graphics | Chromium defaults retained; no custom spoofing implemented | Record hardware adapter, WebGL/WebGPU values and rendering on headed/headless custom builds |
| ENGINE-04 | Fonts | Native Chromium font facilities retained | Font rendering/enumeration coverage, permissions, installed-font provenance and native fallback behavior |
| ENGINE-05 | Canvas and geometry policies | Not implemented | Consistent behavior for canvas, OffscreenCanvas, worker rendering, image export and rectangles; native mode regression checks |
| ENGINE-06 | Audio policies | Not implemented | Offline/real-time audio consistency, stable profile policy, bounded changes and native-mode comparison |
| ENGINE-07 | Screen/display consistency | Native defaults only | Multiple displays, scaling, viewport and outer-window geometry; headed/headless coverage |
| ENGINE-08 | WebRTC privacy/routing | Not implemented | ICE/STUN/TURN, IPv4/IPv6, proxy routing and leak tests; explicit policy and failure behavior |
| NET-09 | Native HTTP proxy credentials | SDK uses Playwright HTTP authentication | Native auth challenge, HTTPS CONNECT, encoded credentials and authenticated proxy fixture tests |
| NET-10 | Native SOCKS5 authentication | Unsupported and rejected explicitly | RFC negotiation, credentials, remote DNS, IPv6, timeouts and error propagation |
| NET-11 | SOCKS5 UDP and HTTP/3 | Not implemented | UDP ASSOCIATE and QUIC end-to-end traffic capture; truthful fallback behavior |
| NET-12 | Network exposure policy | Not implemented | Headers/cache/timing policy with protocol correctness and diagnostic evidence |
| INPUT-13 | Engine/CDP input behavior | SDK pacing only | Native event semantics, actionability, cancellation, timeouts, nested frames and raw driver coverage |
| SDK-14 | GeoIP/timezone/locale | GeoIP rejected explicitly | Deadline-limited resolution through the configured proxy, explicit overrides, cache and failure tests |
| SDK-15 | Extensions and profiles | Profile storage tests pass; extension load unverified | Actual extension worker/content script executes; storage, seeds and lifecycle survive relaunch |
| SDK-16 | Public SDK parity | Scoped reference review recorded | Typed API/options, Python sync/async behavior, Puppeteer launch adapter and lifecycle contracts |
| DRIVER-17 | Driver compatibility | Ten stock-Chrome Windows checks passed | Same suite on custom binaries, supported exact library versions, headed/headless evidence |
| RELEASE-18 | Multiple Chromium lines | Exact pins and support policy recorded | Rebase/build/test each line separately; no broad untested range |
| RELEASE-19 | Distribution | Not implemented | Reproducible packaging, signed version/platform manifests, verified download and safe extraction |
| QA-20 | Competitive evidence | Stock baselines only | Repeated custom and reference runs with comparable versions, profiles, network and environment; retain failures/unavailable results |
| PLATFORM-21 | Linux/macOS builds | Not built/tested | Native platform builders, graphics/font fixtures, driver matrices and signed artifacts |
| PERF-22 | Lightweight operation | Not measured for custom engine | Startup latency, idle and per-page RAM/CPU, concurrent-session stability and cleanup |

## Order of execution

Finish the Windows build and validate the existing identity changes. Run the driver suite and native graphics/font diagnostics. Complete each engine family with its own local fixture before cross-family testing. Bring SDK option handling and lifecycle behavior into parity. Rebase the validated source onto the stable target, then qualify previous-major and additional-platform releases individually. Compare detector measurements only after a custom binary exists.

The project is complete only when the required gates have evidence. Successful compilation, a marketing patch count, a mocked launch test or a single detector score does not satisfy those gates.
