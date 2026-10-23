# silly-browser-fonts

Optional, separately installable **Noto core** fonts for silly-browser. The fonts are unmodified files from the official [Noto font repository](https://github.com/notofonts/noto-fonts/tree/ffebf8c1ee449e544955a7e813c54f9b73848eac), pinned to commit `ffebf8c1ee449e544955a7e813c54f9b73848eac`. The repository is archived; this pack is a fixed input, not a promise of the latest font release.

Includes ten static TTF faces: Noto Sans and Noto Serif in Regular, Bold, Italic and Bold Italic; Noto Sans Mono in Regular and Bold. The fonts total about 5.6 MiB uncompressed. This is not an all-language font collection. The [inventory](silly_browser_fonts/manifest.json) contains exact paths, upstream URLs, sizes and SHA256 values.

Fonts are licensed under **SIL OFL 1.1**, included in [OFL.txt](OFL.txt). Original package helper code is MIT-licensed under [LICENSE](LICENSE). Upstream font names and copyright notices are preserved. No Windows/macOS proprietary system fonts are redistributed.

## Install

Registry publication is pending. Once published:

```sh
npm install silly-browser silly-browser-fonts
python -m pip install silly-browser silly-browser-fonts
```

Before publication, from a repository checkout use `npm install ./packages/fonts` and `python -m pip install ./packages/fonts`. Python also supports `python -m pip install "git+https://github.com/naufal-djamhur/silly-browser.git#subdirectory=packages/fonts"`.

```javascript
import {launch} from 'silly-browser';
const browser = await launch({fontPack: 'noto-core', headless: true});
try { /* Browser actions */ } finally { await browser.close(); }
```

```python
from silly_browser import launch
browser = launch(font_pack="noto-core", headless=True)
try:
    pass  # Browser actions
finally:
    browser.close()
```

The SDK forwards the actual package font directory through the native `--custom-browser-fonts-dir` flag. **The current native loader is Windows-only.** All ten faces load and match expected metrics in both headed/headless modes on the tested Chromium 155.0.8059.80 Windows x64 build; all ten were missing from each baseline without the optional directory. A binary missing its capability rejects the option. It adds fonts to system fallback for that browser process; it does not install system fonts or override JavaScript browser properties. See [the native results](https://github.com/naufal-djamhur/silly-browser/blob/main/docs/engine-validation-155.md).

For custom integrations, use JavaScript `getFontDirectory()` or Python `get_font_directory()`, then pass that directory to an engine supporting native directory loading. `npx silly-browser-fonts path` / `python -m silly_browser_fonts path` prints the location; `verify` checks all ten files against the inventory.

Package installation places fonts inside the npm package or Python environment. There is no extra download, administrator prompt or global font registration. The npm and Python packages contain the same font bytes and inventory. Files must remain available while the browser is running. Native Linux/macOS loading is not implemented by this package.

## Reference Linux font environment

CloakBrowser uses host fonts. Its public [Dockerfile](https://github.com/CloakHQ/CloakBrowser/blob/160f56da85860e89f0e7d9bfdc80266b984057d5/Dockerfile) installs a broader Linux baseline than this Noto core pack. To prepare the same **package selection** on a Debian-derived container, run the following explicitly as root during image construction:

```sh
apt-get update
apt-get install -y --no-install-recommends fontconfig \
  fonts-liberation fonts-noto-color-emoji fonts-unifont fonts-freefont-ttf \
  fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf fonts-urw-base35
fc-cache -f
```

This recipe is not run by npm or pip. The distribution packages carry their respective font licenses; their files are not included in this OFL-only pack. Pin the base image and package snapshot, and preserve `dpkg-query`/`fc-list` output when comparing rendering: equal package names do not ensure equal versions, metrics or output. The recipe has not been executed on this Windows build host and does not qualify a Linux silly-browser runtime.

On Windows the browser keeps the real installed system fonts, with this pack as an optional addition. Proprietary OS fonts are not redistributed here. See [the font comparison and remaining validation](https://github.com/naufal-djamhur/silly-browser/blob/main/docs/font-compatibility.md).
