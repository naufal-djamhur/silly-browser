# Contributing

Thanks for contributing to silly-browser. Start with a small issue or pull request describing the browser behavior, reproduction, expected result and affected version. Include headed/headless mode and driver versions where relevant. Remove credentials, personal profiles, IP addresses and private captures from reports.

## SDK development

Use Node.js 22.12 or newer, Python 3.10 or newer and Git. From the checkout:

```sh
npm ci --ignore-scripts
python -m pip install -e sdk/python
npm test
npm run test:installer
python -m unittest discover -s tests -p python_sdk_contract_test.py
python -m unittest discover -s tests -p python_browser_manager_test.py
```

These are SDK/installer checks; optional browser-dependent cases skip when no explicit test executable is configured. They do not require compiling Chromium. Installer tests use small generated fixtures, not browser downloads.

Keep public API changes consistent between JavaScript and Python. Update examples and tests with the implementation. Keep both bundled release catalogs identical. Never add a download entry before its complete native runtime has been qualified and published with matching checksums.

## Native changes

The source series is pinned under `engine/releases/`. Read [the implementation plan](docs/implementation-plan.md), [current handoff](docs/session-handoff.md) and [post-build gates](docs/post-build-validation.md). Work on one reproducible correctness, compatibility or documented privacy-policy defect at a time. Preserve an existing build and its completed output. Do not silently weaken the sandbox or skip failed qualification.

Patch submissions must be your own work or compatible upstream code with its notices intact. Do not submit proprietary binaries or recovered proprietary source. Submit public source, narrow diffs, tests and measured evidence. Existing benchmark scores are observations, not a feature guarantee.

Contributions are offered under the project license for original code, while upstream material retains its applicable license. This project currently uses no contributor license agreement. Follow [the community guidelines](CODE_OF_CONDUCT.md); report vulnerabilities through [the security policy](SECURITY.md).
