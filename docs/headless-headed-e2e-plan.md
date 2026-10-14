# Headless and headed E2E correctness plan

Date: 15 October 2026, Asia/Jakarta.

Status: planned; this document adds no native patches and records no new browser test results.

## Objective and acceptance

Make legitimate E2E workflows produce equivalent application outcomes under headed and headless operation. Investigate concrete incorrect behavior before deciding that a Chromium C++ change is needed. Chromium engine work is primarily C++, rather than plain C.

This plan does not implement concealment of automation or optimize against third-party bot/CAPTCHA scores. The requested below-10 detector result remains unfulfilled. Existing measurements are retained in the [measurement summary](fingerprint-measurement-summary.json); E2E results must not be presented as detector results.

Proposed release gate: every required fixture passes in both modes for ten independent runs per supported driver, with no unexplained crashes, hangs, duplicate submissions, lost text or persistent-profile corruption. Report the raw denominator and all failures. Ten successful runs provide bounded evidence, not proof that failures are impossible.

## Iteration 0 — qualify the actual build

Follow [post-build validation](post-build-validation.md). Record the selected source revision, patch manifest, build arguments, executable and DLL hashes, engine capabilities and driver versions. Preserve any active build and earlier evidence. Check the actual process and logs on resume rather than assuming an old status file is current.

Run the existing engine, Python and driver checks against the completed binary. Use a distinct report directory. The historical two-patch runtime and the separate stable release remain distinct comparison subjects; legacy candidate source changes are unqualified.

Exit: the selected binary launches in both modes, identifies its release correctly and passes its existing local compatibility gates. A failure becomes the next task; do not proceed with a substituted binary or skipped required check.

## Iteration 1 — establish comparable local controls

Create deterministic local fixtures served on loopback. Use the same machine, fixture revision, application viewport, device scale, language, timezone, driver versions and profile policy for each paired run. Record actual settings and environmental differences. Keep the browser sandbox enabled.

Exercise the existing five driver routes: JavaScript Playwright SDK, JavaScript Playwright CDP, Puppeteer CDP, Python Playwright and Selenium/ChromeDriver. Add the direct Puppeteer SDK adapter as a separately reported route. Driver-specific event sequences may differ; required application outcomes must agree.

Compare the custom build with an unmodified build of the same upstream revision where available. If only a different stock Chromium revision is available, label it as a reference with a version confound, not evidence that a particular patch caused a difference. Native headed behavior alone is not a substitute for an unmodified control.

Exit: each route produces a paired report containing versions, hashes, modes, settings, application assertions and traces. No external detector or CAPTCHA is required by these fixtures.

## Iteration 2 — verify interaction semantics

| Fixture | Required application outcome |
| --- | --- |
| Delayed button | Wait until actionable; submit exactly once |
| Disabled control | Do not activate it while disabled; bounded timeout if it never enables |
| Moving or covered target | Activate the intended target only after it becomes actionable |
| Detached target | Re-resolve safely or return a useful bounded error; never click a replacement accidentally |
| Focus and keyboard navigation | Tab order, focused element and keyboard activation match the fixture contract |
| Text editing | Unicode text, selection, replacement and deletion produce the expected value without lost or duplicated characters |
| Nested scroll container | Reach the intended element without scrolling an unrelated container or losing focus |
| Iframe interaction | Resolve the intended frame and element; preserve frame isolation |
| Popup and navigation | Attach to the expected page, complete navigation and close owned pages |
| Persistent profile | Preserve intended cookies/storage across restart; reject concurrent ownership safely |
| Cancellation | Stop a pending action, release resources and allow subsequent operations |
| Failure cleanup | Remove owned temporary profiles and processes while preserving user profiles |

Start with normal deterministic driver input. Test the existing paced-input helpers separately for completion, cancellation and application correctness. Random delays, curved motion or typing patterns are not evidence that an automated session is human.

Exit: each fixture has explicit assertions and either passes in both modes or has a minimal saved reproduction. Unsupported routes are reported as unqualified, never counted as passes.

## Iteration 3 — isolate and repair one defect

For the first reproducible failure, retain the fixture, event trace, browser logs, launch configuration and both mode results. Determine whether the defect belongs to the application fixture, driver, SDK scheduler, runtime packaging or native engine.

Fix SDK/actionability problems in the SDK. Consider a C++ patch only when the minimized case identifies native incorrect behavior, such as input delivery, focus handling, a renderer crash or a documented privacy policy failing to control actual traffic. Add the smallest meaningful native regression test and preserve standard browser/driver semantics.

Do not select a patch because a detector assigns points to an observable automation property. Do not infer a native bug solely from an overall bot score.

Exit: the minimal test fails before the change and passes afterward in the affected modes. The patch has a documented cause, expected behavior and known limitations.

## Iteration 4 — rebuild and check impact

Rebuild the selected release incrementally, record the new hashes and rerun the failing fixture first. Then run adjacent scenarios and the existing engine/driver gates affected by the change. If a new regression appears, preserve both reports and repair or revert the isolated change rather than accumulating speculative patches.

Once targeted checks pass, run ten independent paired repetitions per required driver. Record pass count, failures, crash count, timeout count, action latency median/p95 and cleanup results. Timing differences are diagnostic observations; investigate them against the fixture's timeout requirements rather than treating identical timing as a correctness requirement.

Exit: the bounded release gate passes, with every observed failure accounted for and no unsupported capability silently included.

## Iteration 5 — record the supported scope

Publish a sanitized summary containing the exact tested release, binary hashes, supported driver routes, scenario coverage and unresolved limitations. Keep raw local traces and profile data private. Update the [session handoff](session-handoff.md) with the first remaining engineering task.

For an application under the user's control, distinguish permitted E2E traffic through a staging configuration or explicit test identity. Validate production protection rules separately with labeled test cases. Browser correctness and a site's decision to admit automated traffic are separate acceptance criteria.

Suggested report location: `artifacts/e2e-parity/<run-id>/`, containing `environment.json`, per-driver/mode results, minimal failure traces and `summary.json`. These are planned artifacts; they do not exist merely because this plan lists them.

Next ready action after a successful native build: iteration 0, then implement the local fixture matrix in iteration 1. This plan does not start a background build or test run.
