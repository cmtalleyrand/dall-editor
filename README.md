# Image API Harness

This project is a Progressive Web App (PWA). You do not download it from an app store. Instead, you host the files, open the URL on your tablet, and install that URL to the home screen.

## Local test run

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser on the same machine.

## Host on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. After you push the repository to GitHub, the workflow publishes the static app to GitHub Pages whenever `main` changes.

1. Push this repository to GitHub.
2. In GitHub, open **Settings → Pages** for the repository.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to the `main` branch, or run **Actions → Deploy static app to GitHub Pages → Run workflow**.
5. Open the deployment URL shown in the workflow summary. For a project repository, the URL is usually `https://<github-user-or-org>.github.io/<repository-name>/`.

The workflow copies only the static runtime files into a `site/` directory before upload. There is no compile step; deployment work is linear in the number of copied files, which is currently a small fixed set plus the icon directory.

## Install on a tablet

1. Host this folder over HTTPS. For development only, `localhost` also works.
2. Open the hosted URL in Chrome, Edge, or Safari on the tablet.
3. In Chrome or Edge, choose **Install app** from the browser install prompt or menu.
4. In Safari on iPad, choose **Share → Add to Home Screen**.
5. Launch **Image API Harness** from the tablet home screen.

The installed app still calls the same hosted URL. It is a home-screen wrapper around the web app, with cached static files for faster startup.

The repository uses a text SVG icon rather than PNG binaries so the complete PR remains text-only.
