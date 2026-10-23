# Engine and SDK completion tracker

Project scope as of 14 October 2026: an independent Chromium engine, multiple Chromium revisions, public SDK review, and measured driver compatibility. The initial native build is a prerequisite, not product completion.

The [implementation plan](implementation-plan.md) turns these gates into 26 iterations with dependencies and acceptance criteria. The [session handoff](session-handoff.md) records the current checkpoint; the [ECC routing guide](orchestration.md) provides optional commands without executing them. Qualification is per declared release/platform tuple, so a Windows release need not wait for optional Linux/macOS support.

## Release lines

See `engine/versions.json` for exact revision pins. Chromium 146 is historical evidence. The six-patch **155.0.8059.80 Windows x64** build passes [native HTTP proxy tests and 48 existing regression checks](native-http-proxy-155.md); production/distribution qualification remains pending. Stock Chrome 155.0.8059.40 only supplies harness evidence. The earlier 156 pin remains a proposed snapshot. No broad Chromium version range is advertised.

Every maintained revision needs a separate ordered patch series, clean checkout verification, build output, binary hash, feature report, and driver matrix. A user-agent override never selects an engine version. A release line becomes supported only after its actual binary qualifies. Security updates require rebasing and re-running these gates.

## Completion gates

| ID | Work | Current evidence/status | Required completion evidence |
|---|---|---|---|
| BUILD-01 | Windows native engine | Windows 146 compilation, version/hash and handshake pass; [evidence](engine-validation-summary.json) | Successful build, engine handshake, exact binary version/hash |
| ENGINE-02 | Platform identity | Windows 146 headed/headless native/preset identities pass on page, frame and three worker types | UA and Client Hints agree across HTTP, main page, frames and workers; native mode preserved |
| ENGINE-03 | Native graphics | Chromium defaults retained; no custom spoofing implemented | Record hardware adapter, WebGL/WebGPU values and rendering on headed/headless custom builds |
| ENGINE-04 | Fonts | Native Chromium font facilities retained | Font rendering/enumeration coverage, permissions, installed-font provenance and native fallback behavior |
| ENGINE-05 | Canvas and geometry policies | Not implemented | Consistent behavior for canvas, OffscreenCanvas, worker rendering, image export and rectangles; native mode regression checks |
| ENGINE-06 | Audio policies | Not implemented | Offline/real-time audio consistency, stable profile policy, bounded changes and native-mode comparison |
| ENGINE-07 | Screen/display consistency | Native defaults only | Multiple displays, scaling, viewport and outer-window geometry; headed/headless coverage |
| ENGINE-08 | WebRTC privacy/routing | Stable source policy and standalone parser checks written; native browser/network qualification pending | ICE/STUN/TURN, IPv4/IPv6, proxy routing and leak tests; explicit policy and failure behavior |
| NET-09 | Native HTTP proxy credentials | Sixth C++ patch passes HTTP Basic/CONNECT/encoded credentials/private-file/denial/bypass in both modes on Windows 155; [scope and evidence](native-http-proxy-155.md) | Bounded local gate complete; TLS-to-proxy, other auth schemes and managed-policy deployment need separate qualification |
| NET-10 | Native SOCKS5 authentication | Unsupported and rejected explicitly | RFC negotiation, credentials, remote DNS, IPv6, timeouts and error propagation |
| NET-11 | SOCKS5 UDP and HTTP/3 | Not implemented | UDP ASSOCIATE and QUIC end-to-end traffic capture; truthful fallback behavior |
| NET-12 | Network exposure policy | Not implemented | Headers/cache/timing policy with protocol correctness and diagnostic evidence |
| INPUT-13 | Engine/CDP input behavior | SDK pacing only | Native event semantics, actionability, cancellation, timeouts, nested frames and raw driver coverage |
| SDK-14 | GeoIP/timezone/locale | GeoIP rejected explicitly | Deadline-limited resolution through the configured proxy, explicit overrides, cache and failure tests |
| SDK-15 | Extensions and profiles | Profile storage tests pass; extension load unverified | Actual extension worker/content script executes; storage, seeds and lifecycle survive relaunch |
| SDK-16 | Public SDK parity | Scoped review; Puppeteer launch/profile/input helpers pass on historical Windows headed/headless binary, broader parity pending | Typed API/options, Python sync/async behavior, Puppeteer launch adapter and lifecycle contracts |
| DRIVER-17 | Driver compatibility | Ten stock-Chrome and ten custom-146 Windows smoke checks passed; expanded feature matrix pending | Same suite on custom binaries, supported exact library versions, headed/headless evidence |
| RELEASE-18 | Multiple Chromium lines | Stable three-patch rebase applies to pristine pinned files; full stable build pending | Rebase/build/test each line separately; no broad untested range |
| RELEASE-19 | Distribution | Not implemented | Reproducible packaging, signed version/platform manifests, verified download and safe extraction |
| QA-20 | Competitive evidence | Stock baselines only | Repeated custom and reference runs with comparable versions, profiles, network and environment; retain failures/unavailable results |
| PLATFORM-21 | Linux/macOS builds | Not built/tested | Native platform builders, graphics/font fixtures, driver matrices and signed artifacts |
| PERF-22 | Lightweight operation | Not measured for custom engine | Startup latency, idle and per-page RAM/CPU, concurrent-session stability and cleanup |

## Order of execution

Steps 1 and 2 passed the Windows integration build and identity/driver checks. Next verify and rebase onto the current supported stable revision, then collect native graphics/font diagnostics. Complete each engine family with its own local fixture before cross-family testing. Bring SDK option handling and lifecycle behavior into parity. Rebase the validated source onto the stable target, then qualify previous-major and additional-platform releases individually. Compare detector measurements only after a custom binary exists.

The project is complete only when the required gates have evidence. Successful compilation, a marketing patch count, a mocked launch test or a single detector score does not satisfy those gates.
