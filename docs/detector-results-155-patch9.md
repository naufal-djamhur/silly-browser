# Patch nine: fresh external diagnostic results

**24 October 2026 — Chromium 155.0.8059.80 Windows x64. Both sites still fail their retained criteria in both display modes.** All four measurements completed, with zero unavailable/error results. [Sanitized evidence](detector-results-155-patch9-summary.json) binds the captures to the same patch-nine EXE/DLL qualified by [the native geometry iteration](geometry-media-155.md).

| Mode | Fingerprint Scan bot risk | CreepJS like headless | CreepJS headless | CreepJS stealth |
| --- | --- | --- | --- | --- |
| Headed | **100/100** | 31% | **33%** | 0% |
| Headless | **100/100** | 38% | **100%** | 0% |

The unchanged criteria are Fingerprint Scan **<10**, and the reviewed CreepJS example's **headless <=30% and stealth <=30%**. Like-headless is informational in its actual pass expression. Outcome: **zero passes, four failures**. Collector success is not a detector pass.

## Published observations

CreepJS reports `webDriverIsOn=true` in both modes. `hasHeadlessUA` and `hasHeadlessWorkerUA` are false headed and true headless. Its three-flag headless group therefore remains 33%/100%. All five captured stealth checks are false, so the 0% stealth criterion passes separately. The like-headless true flags remain the same as the saved patch-seven captures, including the configured screen/taskbar and light-preference heuristics.

Fingerprint Scan's published object reports:

| Check | Headed | Headless |
| --- | --- | --- |
| `webdriver` | `true` | `true` |
| `webdriverWritable` | `true` | `true` |
| `seleniumProperties` | `false` | `false` |
| `cdpStackCheck` | `true` | `true` |
| `playwrightFlags` | `false` | `false` |
| `chromeDriverFlags` | `false` | `false` |
| `automationKeysCheck.detected` | `true` | `true` |
| `iframe.cdpCheck` | `true` | `true` |
| `iframe.webdriver` | `true` | `true` |
| `iframe.iframeOverridden` | `false` | `false` |
| `worker.cdpCheck` | `true` | `true` |

Browser category points remain **+305 headed / +480 headless (HIGH)**; network is **+49 / +50 (MEDIUM)** and hardware is **0 (LOW)** in the public reasons. The public checks and category totals do not reveal every private weight or prove a counterfactual score after changing one field. [Its documentation](https://fingerprint-scan.com/docs) distinguishes identity inconsistencies from strong automation indicators.

## Conditions and limits

The same reviewed reference helpers use raw Python Playwright **1.62.0**, a configured **1920×1080** viewport, DPR **1**, fresh isolated contexts per site, no proxy, no humanization and no native locale/timezone/font overrides. ChromeDriver is not used. The reference helper source is hash checked before measurement; four collector-parser checks pass. The [CreepJS source snapshot](https://github.com/abrahamjuliot/creepjs/blob/10aa6724cd33a1015db1574211890518cd04f0cc/src/headless/index.ts) supports the published flag interpretation; its repository snapshot does not independently prove the deployed site's exact commit.

The scores match prior patch-seven observations; this is a historical comparison, not a fresh paired stock/CloakBrowser rerun. One capture per site/mode on one host is not broad reliability evidence. Captured diagnostics show **0 crashes, 0 uncaught page errors, 0 navigation failures and 0 unexpected disconnects**.

Patch nine fixes dynamic DPR-only CSS invalidation. A static diagnostic score does not exercise or invalidate that owned regression. No additional native/driver patch was added by this rerun. The exact nine-patch checkout verifies and runtime hashes remain unchanged. No compiler was started.

- EXE SHA256: `97b9577437513d19f289fd9bd76e2953956c1e7e014fa2d09cf622ebebcff052`.
- DLL SHA256: `21e04f73104e3f44070953950444e36148bdf717b79ab1052442ef4f462abff1`.
- Raw captures: `artifacts/detector-patch9/20261024-run1/` (private; identifiers/network data omitted from public reports).

The [font/GeoIP and remaining-failure plan](fonts-geoip-next-plan-155.md) starts from these measured failures. It does not count feature implementation as a detector pass.
