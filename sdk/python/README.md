# silly-browser

Experimental Python SDK for the independent source-patched Chromium project [silly-browser](https://github.com/naufal-djamhur/silly-browser). Python 3.10 or newer is required. Original SDK code is MIT-licensed; Chromium and dependencies retain their upstream licenses.

The native Chromium 155.0.8059.80 Windows x64 runtime compiles and passes 48 local integration checks. No native runtime download is published yet; complete release qualification remains pending. The package can be built and installed from source now:

```sh
python -m pip install "git+https://github.com/naufal-djamhur/silly-browser.git#subdirectory=sdk/python"
python -m silly_browser status
```

After registry publication, the package name is `silly-browser`. Both `from silly_browser import ...` and the existing `from custom_browser import ...` imports are supported.

```python
from silly_browser import launch

# Installs a pinned, qualified runtime on first launch once one is published.
# Until then, provide executable_path="PATH_TO_YOUR_BUILT_CHROME".
browser = launch(headless=True)
try:
    page = browser.new_page()
    page.goto("https://example.com")
finally:
    browser.close()
```

`python -m silly_browser install` explicitly prefetches a published runtime. `path` locates an installed runtime; `status` reports availability. The same commands are available through the `silly-browser` console entry point.

JavaScript and Python share a versioned user cache. Configure it with `SILLY_BROWSER_CACHE_DIR`; select a bundled release with `SILLY_BROWSER_REVISION`. `SILLY_BROWSER_EXECUTABLE_PATH` selects a local build. `SILLY_BROWSER_SKIP_DOWNLOAD=1` disables downloads while permitting valid cached runtimes. Importing/installing the Python package does not download or compile Chromium. Downloads happen on explicit install or first launch, use pinned checksums, and need no system-wide installation.

Only published host/architecture combinations can be downloaded. SDK platform identity settings do not select a different native operating-system binary. See the repository for persistent-context APIs, async APIs, native feature scope, pending qualification and contribution instructions.

Fonts are optional and separately packaged as `silly-browser-fonts`. After publication, use `python -m pip install 'silly-browser[fonts]'`; from a checkout, use `python -m pip install ./packages/fonts` alongside this SDK. `launch(font_pack="noto-core", executable_path="PATH_TO_YOUR_BUILT_CHROME")` selects the ten packaged Noto faces through the native Windows directory loader. All ten load and match expected metrics on the tested Windows 155 runtime in both modes. `font_directory` accepts your own licensed directory instead. The default retains installed system fonts. The font package README includes the reference Linux font recipe; Noto core alone does not match that broader environment.
