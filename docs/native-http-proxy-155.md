# Native HTTP proxy authentication — Windows Chromium 155

The sixth independent C++ patch adds process-wide HTTP Basic proxy credentials to **155.0.8059.80 Windows x64**. The owned local proxy fixture passes all five scenarios in **headed and headless** modes. Credentials are handled in Chromium, with no Playwright `proxy` option, `httpCredentials`, injected JavaScript or ChromeDriver binary modification.

## Measured behavior

| Scenario | Headed | Headless |
| --- | --- | --- |
| Inline credentials, HTTP origin | Pass | Pass |
| Inline credentials, HTTPS origin over CONNECT | Pass | Pass |
| Credentials from a private configuration file | Pass | Pass |
| Wrong credentials terminate without a dialog or retry loop | Pass | Pass |
| Standard Chromium proxy bypass routes directly | Pass | Pass |

The five-patch control fails inline authentication with `ERR_NO_SUPPORTED_PROXIES` in both modes. The new fixture passes **12 Node tests**: ten scenario observations, their parent and one startup-validation test containing thirteen malformed/conflicting configurations. Wrong-password runs make one credential-bearing attempt and never reach the origin. HTTP and encrypted HTTPS origins receive neither origin `Authorization` nor `Proxy-Authorization` credentials. Chromium's in-process command-line diagnostic contains only the sanitized proxy endpoint.

The HTTPS fixture uses a generated, two-day self-signed certificate and context-scoped `ignoreHTTPSErrors`; the test changes no OS trust configuration. This qualifies HTTPS **through an HTTP proxy**, not TLS transport **to the proxy**. Test credentials are synthetic and reports retain authentication booleans, not header values.

See [the machine-readable evidence](native-http-proxy-155-summary.json) for exact patch, executable, DLL and test-source identities, additional regression results and limitations. The five-patch runtime and the user's manual session remain unchanged. The six-patch DLL was linked and staged separately using the same expanded Chromium link inputs; no full rebuild or dependency sync was needed.

All **48 existing regression checks** also pass on this six-patch runtime: 32 JavaScript engine/native/context/WebRTC checks, five Python checks, ten driver routes and the optional Noto font-pack check. Four standalone native policy executables pass. GN header dependency checks and exact six-patch checkout verification pass. No external detector benchmark was rerun for this transport feature.

## Configuration

The native flag accepts one HTTP proxy URI, with URI-encoded userinfo:

```text
chrome.exe --proxy-server="http://USER:ENCODED_PASSWORD@proxy.example:8080"
```

Inline credentials can appear in the initial OS process command line and launcher logs. For actual secrets, place the URI in an ACL-restricted UTF-8/ASCII text file outside source control and pass its absolute path:

```javascript
import {launch} from 'silly-browser';
const browser = await launch({
  executablePath: 'PATH_TO_THE_SIX_PATCH_CHROME_EXE',
  headless: true, // false uses the same native authentication path
  args: ['--custom-browser-http-proxy-file=C:\\private\\proxy.txt'],
});
// Use browser.newPage(); close the owned browser when finished.
```

Python launch functions accept the same flag through `args`. Do not combine it with the SDK's `proxy` option, another `--proxy-server`, `--no-proxy-server`, PAC or proxy auto-detection. Standard `--proxy-bypass-list` remains available. A file is read once at startup, is limited to 4 KiB, and is not deleted by the browser. Restart to change credentials. Do not share this process-wide configuration between tenants requiring different proxy identities.

## Native design and scope

Startup validates and consumes userinfo after Chromium registers URL schemes, before preference/network-context and child-process creation. It replaces the command-line proxy URI with a credential-free endpoint and keeps credentials in browser memory. A request-owned, asynchronous C++ login delegate answers only the configured proxy's first Basic challenge. Endpoint/scheme matching, origin challenges, repeat attempts and managed proxy precedence have standalone policy checks. Managed-policy deployment itself remains an integration gap.

Only the declared Windows x64 build is qualified. ASCII credentials, a nonempty username and one HTTP Basic proxy are supported. Percent encoding is decoded exactly once; control bytes and a colon in the username are rejected. TLS-to-proxy, Digest, NTLM, Negotiate, authenticated SOCKS, UDP/HTTP3, PAC chains, per-context credentials, and automatic proxying of Playwright's separate `APIRequestContext` are outside this iteration. Existing typed SDK proxy behavior is unchanged; the new path is selected explicitly with native arguments. No proxy timing/header concealment is included.

## Reference investigation

The pinned public wrapper revision is `160f56da85860e89f0e7d9bfdc80266b984057d5`. Its [proxy resolver](https://github.com/CloakHQ/CloakBrowser/blob/160f56da85860e89f0e7d9bfdc80266b984057d5/js/src/proxy.ts) normalizes userinfo and selects native `--proxy-server` instead of a driver proxy option for supported binary versions. REA's inert JavaScript analysis records that selected contract; it does not recover a native implementation.

An REA controlled replay against the saved free **146.0.7680.177.5 Windows** binary failed navigation with a protocol error and reported incomplete observer cleanup. The owned test processes were subsequently closed. Direct Playwright controls also fail this particular encoded-password HTTP fixture in both modes with `ERR_INVALID_AUTH_CREDENTIALS`; the proxy observes no credential-bearing retry. These failures do not establish why the historical reference fails, or how a current reference binary behaves. No reference C++ function or proprietary patch was recovered/copied, and no 1:1 product parity is claimed.

The new feature follows the documented interface and our independently tested contract. [The broader coverage ledger](native-analysis-coverage.md) remains partial.
