# Stable rebase and SDK checkpoint — 14 October 2026

**Step 3 is in progress.** The exact stable source checkout is available and the Windows toolchain checks pass. The stable engine has not compiled; dependency synchronization and hooks remain incomplete.

## Source and toolchain

The verified target is Chromium **155.0.8059.80**, commit `43a195105613ac83c21d3f14de279f4a045c7da0`. The official release endpoint and both source transports agreed on this pin. The main source checkout was recovered through the official GitHub mirror after the Chromium Git server repeatedly returned `curl 28` throughput timeouts. Existing historical Git objects were copied into the separate checkout; no shared mutable source files or historical build output were reused.

Installed Visual Studio **18.11.12306.390**, MFC/ATL, SDK **10.0.28000.2705**, and debugger **10.0.26100.4654** satisfy the pinned source requirements. All seven patch-input files in the actual full checkout match the recorded upstream SHA256 hashes.

The three ordered stable patches apply to a separate hash-checked pristine fixture:

1. Seed initialization, process switch propagation and the engine handshake, rebased for the new browser/renderer build split.
2. Explicit desktop web identity settings; native defaults stay the default.
3. Explicit WebRTC IP-handling policy through renderer preferences, preserving managed enterprise policy precedence and existing per-origin rules.

These are **source-written, not compiled or browser-validated on stable Chromium**. The engine handshake lists explicit capabilities, so an SDK cannot infer a feature from an unrelated patch count. The stable WebRTC patch is independent of the historical line's candidate patches with the same numerical ID.

The [machine-readable checkpoint](stable-sdk-checkpoint.json) records these boundaries and the added SDK evidence.

## Additional measured SDK evidence

- Eight JavaScript foundation/configuration checks pass, including the real stock-browser input/profile fixture and rejection of WebRTC policies by the historical engine that lacks the capability.
- Three Puppeteer adapter checks pass: actual custom Chromium 146 headed and headless input/actionability/profile lifecycle, plus explicit rejection of unsupported authentication and locale options.
- Two release-selection checks pass: historical/stable separation and rejection of path/range inputs.
- Three Python WebRTC option/capability guards and all five existing Python custom-engine checks pass against the preserved historical engine.
- The standalone WebRTC C++ policy parser compiles and passes. This does not establish Chromium linkage or network behavior.

The Puppeteer runs bind to the historical executable SHA256 `c6b180610bb528ba2eb4f84490ff7f45e95c49a4b30c4d3663da4af906436927` and DLL SHA256 `29f1d515805c781d8c279ddf53f6f9e655dcf11d8416404ad8055b7841836e23`, using Puppeteer 25.13.0 and Node 24.19.0. Initial backup-folder launches failed because the copied runtime lacked sandbox read permissions. Correcting only that runtime's read/execute ACL restored sandbox-enabled operation; the earlier failure report is retained locally.

The adapter returns a Puppeteer Browser, preserves persistent profile seeds/cookies/localStorage, owns and cleans temporary profiles, and provides explicit actionability helpers and bounded input pacing. Popup/context/frame wrapping, authenticated proxy support and locale/timezone options remain incomplete. No native input or detector outcome is inferred from these SDK checks.

A local STUN fixture is source-written to compare real direct UDP traffic under default and disabled-non-proxied-UDP policies. It awaits a compiled capable engine; TURN, IPv6, remote proxies and managed/per-origin precedence need further fixtures.

## First unresolved boundary

Dependency sync was interrupted after its main-source URL mismatch caused a broad refetch from the stalled server. The separate checkout configuration now consistently uses the verified official mirror. Automatic approval review then rejected restarting the stable native pipeline as **“blocked by policy”**, without a further reason. No stable compiler is active and no stable binary exists. No attempt was made to bypass that rejection.

Preserve the source checkout and the historical tested runtime. The next engineering action is dependency synchronization, then build hooks and clean patch verification, native compilation, exact-version identity/seed checks, Python checks, WebRTC fixture checks and the driver matrix. Do not advertise stable support until the actual binary passes its gates.

## Primary sources

- [Official Windows stable release data](https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1)
- [Pinned source tag](https://github.com/chromium/chromium/tree/155.0.8059.80)
- [Pinned Windows build requirements](https://github.com/chromium/chromium/blob/43a195105613ac83c21d3f14de279f4a045c7da0/docs/windows_build_instructions.md)
