# Fingerprint measurement checkpoint — 14 October 2026

The requested score below 10 has **not** been achieved.

The [15 October reference-example assessment](reference-tests-prestable.md) confirms 100/100 again in both modes on the preserved runtime. It adds the requested basic, CreepJS, reCAPTCHA and stealth-suite observations without a new native build.

The user clarified that the intended use is legitimate automation and avoiding mistaken classification. That intent is recorded here. An automated session may still be classified as automated; a score alone does not establish that a detector made a mistake. Compatibility and documented privacy defects can be investigated without concealing automation.

This checkpoint and the [sanitized measurement summary](fingerprint-measurement-summary.json) are saved for continuation. The [post-build checklist](post-build-validation.md) records how to qualify a completed native build. Uncompiled candidate source changes remain local and are excluded from the documentation commit.

The existing Windows Chromium 146.0.7680.177 binary, containing two previously validated source patches, measured **100/100** in one fresh-profile headed run and **100/100** in one fresh-profile headless run. These measurements do not establish a distribution across repeated runs. Local raw captures remain private.

Evidence:

- `artifacts/custom-fingerprint-initial-headed/results.json`
- `artifacts/custom-fingerprint-initial-headless/results.json`
- Previously validated binary: executable SHA256 `c6b180610bb528ba2eb4f84490ff7f45e95c49a4b30c4d3663da4af906436927`; runtime DLL SHA256 `29f1d515805c781d8c279ddf53f6f9e655dcf11d8416404ad8055b7841836e23`.

The legacy checkout now contains candidate CB-0003 and CB-0004. They are **uncompiled and unvalidated**. The existing binary does not contain them. Do not interpret the earlier completed native-build status as a successful build of these candidates.

At this checkpoint no siso, ninja, clang-cl or lld-link process was active. No candidate rebuild has been launched. Existing source files, runtime and manual profile were preserved.

The user authorized coordination with “Plan a custom automation browser”. That chat confirmed it will preserve the legacy checkout and use a separate checkout for the stable release. It owns stable-release preparation and ordinary compatibility work.

Work specifically intended to conceal automation to bypass anti-bot or CAPTCHA protections will not continue. Appropriate continuation includes supported Chromium compilation, driver interoperability, transparent automation, privacy controls and reproducible compatibility measurements. No undetectability, CAPTCHA outcome or unsupported Chromium version range is claimed.
