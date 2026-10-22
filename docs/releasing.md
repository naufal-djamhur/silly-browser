# Publishing SDKs and native runtimes

The repository is public. npm and PyPI packages are prepared but not published. Maintainer registry accounts have been created; local authentication and the first publication remain pending. The owner has authorized publishing after the SDK and native qualification gates pass. Public npm packages and ordinary public PyPI publishing do not require a paid subscription; optional paid organization features are unnecessary for this project.

Use individual accounts at [npm](https://www.npmjs.com/signup) and [PyPI](https://pypi.org/account/register/), verify email and configure the required account security. Keep recovery codes private. Registry names are not reserved by this repository; recheck ownership/availability before the first publish.

## SDK package checks

Use Node.js 22.12+ and Python 3.10+. From the repository root:

```sh
npm ci --ignore-scripts
npm test
npm run test:installer
python -m pip install -e packages/fonts -e sdk/python build twine
python -m unittest discover -s tests -p python_sdk_contract_test.py
python -m unittest discover -s tests -p python_browser_manager_test.py
python -m unittest discover -s tests -p python_font_pack_test.py
python -m unittest discover -s tests -p browser_catalog_test.py
npm pack --dry-run
python -m build sdk/python --outdir dist
python -m twine check dist/*
```

Inspect package contents. npm contains the JS SDK, bundled catalog, README and notices. The wheel/source distribution contains both Python import names, its CLI, bundled catalog and notices. Browser profiles, logs, artifacts, reference binaries and the Chromium source/build tree must stay out. Installing/importing either SDK must not trigger native compilation or a browser download.

The optional `silly-browser-fonts` package is separately built from `packages/fonts` for npm and PyPI. It contains one shared inventory and ten unmodified Noto TTF files under OFL-1.1, plus MIT package helpers. Run `npm pack ./packages/fonts` and `python -m build packages/fonts --outdir FONT_DIST`; inspect the archives, verify all font hashes, and retain both LICENSE and OFL.txt. Publish it separately so browser users can choose the extra data. Package byte verification and standalone DirectWrite checks do not replace the actual native browser rendering gate. The Python SDK's `fonts` extra refers to this separate package; local source development should install `packages/fonts` first.

The [font compatibility comparison](font-compatibility.md) records the reference Linux package list, the smaller Noto pack's coverage and host-font qualification boundaries. Publish the optional fonts before the SDK's first release so its `fonts` extra resolves. Do not package proprietary OS font files or describe this pack as the reference's complete font environment.

Once maintainer accounts are available, publishing can use `npm publish --access public` and `python -m twine upload dist/*`. Authenticate locally through the registry's supported mechanism; do not paste tokens into chat or commit them. GitHub Actions trusted publishing is an optional next step after account/project ownership is established. The current CI workflow tests/packages only and cannot publish. Recheck the artifact/version and account immediately before the first upload; publishing a version is an external release action.

## Native runtime release

Do not add a placeholder URL or distribute the unfinished build. Finish the five-patch engine, run the required [post-build gates](post-build-validation.md), and preserve executable/DLL hashes, driver versions and results in both modes. Stage the complete runtime with its DLLs, resources, locale data, sandbox helpers and generated Chromium third-party notices. Test this staged layout after extracting its final ZIP; a successful source-tree launch alone does not prove a complete distribution.

The initial installer release is Windows x64 only. There is no qualified Linux/macOS binary. SDK cache-path support and CI on those operating systems do not qualify native artifacts there.

Create the ZIP with runtime-relative paths (`chrome.exe` at the archive root). Exclude source, object files, build graphs, PDBs, user profiles and private evidence. Retain `LICENSE.chromium.html` and the complete upstream notices. The metadata helper reads an existing ZIP and a successful pipeline receipt; it never builds, signs, uploads or publishes:

```sh
python build/make_browser_catalog.py --archive PATH_TO_COMPLETE_RUNTIME.zip --qualification-status PATH_TO_PASSED_STATUS.json --revision 155.0.8059.80-silly.1 --output NEW_CATALOG.json
```

The helper requires an `integration-passed` receipt with `compiled`/`validated` true, checks the first Windows 155 version, and binds ZIP executable/DLL hashes to that receipt. It requires core resource/notice files and rejects build-tree content, unsafe paths and unsupported ZIP members. This is a local release gate, not an independent signed attestation or a complete test of every resource.

Upload the matching archive to the exact GitHub Release URL generated in the catalog. Read the asset back and verify size/SHA256. Review the full inventory, then copy the same catalog to `sdk/js/releases.json` and `sdk/python/custom_browser/releases.json`. Rerun installer and package tests, bump SDK versions consistently for any already-published versions, and publish the SDKs. Catalog metadata is pinned in the packages, so existing users obtain new revisions by upgrading their SDK.

Keep the SDK catalog empty until this process succeeds. Failure or missing platform support must remain explicit. Do not silently use a stock Chrome or the historical 146 runtime. Browser security updates require new, qualified and published native revisions; the installer does not run a background updater.

## Installer behavior and limits

Runtime installers use the same revision/platform user-cache layout in JS and Python, an exclusive install lock, a temporary directory and atomic final rename. Archive size is limited to 2 GiB, expanded files to 8 GiB total/4 GiB each and entries to 20,000. Every regular file is inventoried and verified. Paths must be portable relative paths; links, traversal, case collisions, encrypted entries and unknown files are rejected. Downloads begin at this repository's HTTPS GitHub Release URLs and allow only the approved GitHub asset redirect hosts.

Downloads are checked against the shipped catalog's SHA256 values; native publisher signatures are not implemented. No telemetry is added. Network access is limited to the requested runtime download, in addition to ordinary package-manager dependency fetching. Interrupted processes may leave an install lock: confirm no installer is running before manually removing that exact lock and retrying. Never delete an active installation or another user's cache.
