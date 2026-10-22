# Security policy

silly-browser is experimental. No production security support window or automatic browser security-update service is established yet. A historical compiled version is not a current supported browser release. Native release artifacts require qualification before distribution.

For a suspected vulnerability, use the repository's **Security → Report a vulnerability** option when available. Otherwise, open an issue requesting a private reporting channel without publishing exploit details, credentials or personal data. Maintainers will arrange a private channel before requesting sensitive evidence. Do not send secrets in pull requests or CI logs.

Useful reports include the affected SDK/native version, platform, a minimal reproduction, expected security boundary and impact. Browser engine vulnerabilities should also follow the upstream Chromium reporting process where appropriate. No response-time guarantee or bounty program is currently offered.

Runtime downloads are pinned in the shipped SDK catalog and verified against archive and individual file SHA256 values. This detects content changes relative to the catalog; it is not independent publisher signature verification. Keep installed SDK packages and browser releases current. The installer does not disable antivirus, modify system font directories or request administrator access.
