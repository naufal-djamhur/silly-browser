# Font compatibility and the reference baseline

Reviewed 23 October 2026 against the public CloakBrowser checkout at [`160f56da85860e89f0e7d9bfdc80266b984057d5`](https://github.com/CloakHQ/CloakBrowser/tree/160f56da85860e89f0e7d9bfdc80266b984057d5). This is a public source comparison, not a complete inventory of its distributed native binary or proof of rendering equivalence.

CloakBrowser's [font helper](https://github.com/CloakHQ/CloakBrowser/blob/160f56da85860e89f0e7d9bfdc80266b984057d5/js/src/fonts.ts) checks fonts installed on the host. It does not download a universal Windows/macOS font bundle. Its [Dockerfile](https://github.com/CloakHQ/CloakBrowser/blob/160f56da85860e89f0e7d9bfdc80266b984057d5/Dockerfile) installs the following Debian packages:

| Package | Intended coverage |
| --- | --- |
| `fonts-liberation` | Latin sans, serif and monospace families |
| `fonts-noto-color-emoji` | Color emoji |
| `fonts-unifont` | Broad Unicode fallback |
| `fonts-freefont-ttf` | Additional outline font fallback |
| `fonts-ipafont-gothic` | Japanese |
| `fonts-wqy-zenhei` | Chinese/CJK |
| `fonts-tlwg-loma-otf` | Thai |
| `fonts-urw-base35` | Additional standard document families |

The separately installable `silly-browser-fonts` package currently contains **Noto core only**, with ten unmodified OFL faces. It is an optional deterministic rendering input, not this complete Linux baseline, an OS font replacement, or a CloakBrowser font-equivalence claim. It omits emoji/CJK/Thai coverage from the table. The eight-package Linux recipe is included in its README so npm and Python package users receive the same setup instructions; package installation does not run that recipe.

On Windows, silly-browser's native loader retains the installed DirectWrite system fonts and optionally adds a directory. Matching the reference's host-font approach does not require repackaging the Windows font directory. Microsoft's [font redistribution FAQ](https://learn.microsoft.com/en-us/typography/fonts/font-faq) permits applications to use installed Windows fonts but does not generally grant application redistribution rights. User-supplied fonts require their own applicable rights; no proprietary OS fonts are included in our public package. A font's document-embedding bits alone are not application redistribution permission.

The Linux recipe obtains fonts and their associated notices from the distribution packages. These packages have different licenses; their data is not relabeled as OFL or placed into our OFL-only Noto pack. Package versions depend on the selected distribution snapshot. An equivalent package list alone does not establish identical font files, metrics or rasterization.

## Qualification

| Path | Current state | Required evidence |
| --- | --- | --- |
| Windows system fonts | Stock host font fallback retained in the native source | Compare real local font loading and rendering in both modes on the linked binary |
| Windows optional Noto directory | Ten files pass standalone native DirectWrite acceptance, plus a corrupt-file negative control | `npm run test:font-pack:engine` with the finished five-patch engine; record actual face loading/advance widths, baseline presence and binary hashes |
| Linux reference package list | Recipe documented, not installed or tested here | Qualified Linux runtime and container; preserve image digest, package versions, actual file hashes and local font rendering results |
| macOS system fonts | Future native product | Qualified macOS runtime and host-font checks |

The existing Ahem native-environment fixture checks a controlled metric difference. The Noto fixture exercises ten real packaged faces with kerning disabled and baseline observations, in both headed and headless modes. If a font already exists on the host, successful loading of that face alone cannot prove it came from the optional directory. None of these results predicts third-party bot classification.
