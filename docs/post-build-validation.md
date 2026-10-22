# After a native rebuild

Compilation establishes that the selected source links successfully. It does not establish driver compatibility, implemented capabilities or a detector score below 10. The current measured historical binary scored 100/100 in both display modes; no passing rebuild has replaced it.

The intended use is legitimate automation with fewer false positives. Record a concrete incorrect observation or broken browser behavior before treating a classification as a defect. A detector recognizing an automated session is not, by itself, evidence of a browser correctness bug.

## Identify the build

Preserve the previous runtime and reports. Record the source commit, selected release manifest, build configuration, Chromium version, executable SHA256 and runtime DLL SHA256. Do not copy only `chrome.exe`: the runtime DLL, resources, locales and manifests are part of the build.

For the separate pinned stable build, run from the repository root with Node.js >=22.12 and the configured Python compatibility environment. Replace the example paths with the actual completed build and Python executable:

```powershell
$env:CUSTOM_BROWSER_EXECUTABLE = 'PATH_TO_FINISHED_155_RUNTIME\chrome.exe'
$env:CUSTOM_BROWSER_RELEASE = '155.0.8059.80'
$validationPython = 'PATH_TO_CONFIGURED_PYTHON.exe'
$validationRun = Get-Date -Format 'yyyyMMdd-HHmmss'
$validationDir = Join-Path (Get-Location) "artifacts/post-build/$validationRun"
New-Item -ItemType Directory -Path $validationDir -Force | Out-Null

$validationRuntime = Split-Path $env:CUSTOM_BROWSER_EXECUTABLE -Parent
Get-FileHash -Algorithm SHA256 -LiteralPath $env:CUSTOM_BROWSER_EXECUTABLE, (Join-Path $validationRuntime 'chrome.dll') |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $validationDir 'runtime-hashes.json')
& $env:CUSTOM_BROWSER_EXECUTABLE --headless --custom-browser-engine-info
```

The output path is an example, not evidence of an existing binary. The selected version must match the actual release manifest. Confirm the engine handshake and patch count/capabilities match that manifest before continuing. A failure or missing binary stops validation; do not silently substitute stock Chrome. The legacy checkout currently contains unpublished, uncompiled candidate changes and is separate from this stable workflow.

## Run the existing compatibility gates

Use a new report directory so the historical reports remain intact. Run each command separately and stop on a nonzero exit code:

```powershell
$env:CUSTOM_ENGINE_REPORT = Join-Path $validationDir 'engine-results.json'
$env:CUSTOM_PYTHON_ENGINE_REPORT = Join-Path $validationDir 'python-results.json'
$env:CUSTOM_WEBRTC_REPORT = Join-Path $validationDir 'webrtc-results.json'
$env:CUSTOM_CONTEXT_REPORT = Join-Path $validationDir 'context-results.json'

npm run test:engine
& $validationPython tests/python_custom_engine_test.py
npm run test:context
npm run compatibility -- --executable $env:CUSTOM_BROWSER_EXECUTABLE --engine-mode custom --python $validationPython --both-modes --output (Join-Path $validationDir 'drivers')
```

The identity/seed checks cover HTTP, document, iframe and worker agreement, persistent storage and profile ownership. The driver matrix covers Playwright, Puppeteer CDP, Python Playwright and Selenium in both display modes. These gates exercise ordinary browser control; they do not qualify detector or CAPTCHA outcomes. A skipped or unavailable check cannot qualify a feature.

For a build advertising the `webrtc-policy` capability, also run:

```powershell
npm run test:webrtc
```

This checks actual local IPv4 STUN traffic under the documented policies. It does not establish TURN, IPv6, remote proxy or enterprise-policy behavior. A build missing the capability must reject the option explicitly.

The optional `npm run test:puppeteer` suite writes to the fixed `artifacts/compatibility/puppeteer-sdk/results.json` path. Preserve any existing report before running it, then copy the new report into this validation directory. That suite covers the direct Puppeteer SDK adapter separately from CDP attachment.

## Record results and choose the next C++ change

The [headless/headed E2E plan](headless-headed-e2e-plan.md) defines the next local interaction fixtures, paired controls and bounded reliability gate. It is planned work, not completed validation.

Update the handoff with the exact binary hashes, passed/failed checks, logs, feature limitations and first unresolved regression. Keep source-written and browser-validated capabilities distinct. Public summaries should omit credentials, private profiles, IP addresses and raw page captures.

Appropriate next native work is driven by a reproducible engineering failure: compile/link errors, crashes, resource leaks, protocol interoperability defects or incorrect behavior of a documented privacy control. Reproduce the failure locally, make one narrow C++ change, rebuild and repeat the affected compatibility checks. Preserve the earlier evidence and broaden testing only when the change warrants it.

There is no prescribed C++ patch set that guarantees a third-party bot score below 10. Work intended specifically to conceal automation or bypass anti-bot/CAPTCHA protections is outside this continuation. Honest measurements remain useful; a successful build or a passing driver test must never be reported as a detector pass.
