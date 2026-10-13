# Driver compatibility checks

Requires Node.js >=22.12, the project npm dependencies, and Python with `sdk/python[compatibility]` installed. Puppeteer is a test dependency; Chromium downloads are not requested by this package. Selenium Manager downloads a matching ChromeDriver when needed.

Persistent seed creation now requires a profile filesystem supporting atomic hard links (the tested NTFS workspace does). Corrupt seeds are preserved and raise an error; an explicit override does not overwrite the stored identity. Concurrent seed initialization does not make simultaneous browser launches with one profile supported: Chromium retains its normal profile lock.

Run from the project directory:

```powershell
npm run compatibility -- --executable "PATH_TO_BUILT_CHROME.exe" --engine-mode custom --python "PATH_TO_PYTHON.exe" --both-modes
```

To validate the harness with stock Chrome, explicitly set `--engine-mode baseline`. Custom mode requires our engine handshake; a baseline report cannot qualify a custom release.

The ten local checks cover JS Playwright SDK, JS Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver in headed and headless modes. They exercise navigation, input/click, an iframe, storage across reload and observed browser values. JavaScript and Selenium also record protocol information. Binary SHA256, host architecture, timings and failures are retained in the report.

CDP tests use a dedicated temporary profile and an ephemeral loopback port. Clients connect to a browser launched by our SDK. This proves basic attachment, not every driver feature or Puppeteer launch-wrapper parity. No bot detector or CAPTCHA is part of this suite.

The fixture does not cover downloads, file uploads, permissions, mobile/touch, tracing, native dialogs, proxies, extensions, reconnect, simultaneous clients or long-lived sessions yet. Those require additional feature tests before claiming full compatibility.
