# Chenyang Bai — personal website

Static English portfolio. No runtime package installation or build is required.

## Local preview

```bash
python3 preview.py --port 4173
```

Open http://127.0.0.1:4173/ . This server exposes only the explicit website allowlist, not other documents in the working directory.

## GitHub Pages

Repository: https://github.com/BaiWi11Back/Profile

Website: https://baiwi11back.github.io/Profile/

Pushes to `main` trigger `.github/workflows/pages.yml`. The workflow runs content/privacy checks and Chromium acceptance tests before publishing only the public files listed in `preview.PUBLIC_FILES`. Source documents, tests, and Python scripts are not included in the Pages artifact.

All site links and resources are relative, including research-detail navigation, so the project subpath is supported.

## Tests

```bash
python3 -m unittest discover -s tests -v
node --check script.js
```

Browser tests require Playwright and Chromium. Set `PLAYWRIGHT_MODULE` to the absolute path of the installed `playwright/index.mjs`, then run `node --test tests/browser.test.mjs`. Set `PREVIEW_URL` to check another deployment; do not include a trailing slash for a project URL.

The terrain artwork and research overview diagram are illustrative, not measured results. Conference acceptance is distinguished from publication. Private original documents are not distributed with this website.
