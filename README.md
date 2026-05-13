# Image API Harness

This project is a Progressive Web App (PWA). You do not download it from an app store. Instead, you host the files, open the URL on your tablet, and install that URL to the home screen.

## Product direction

The intended end goal is a personal, tablet-friendly image generation and editing app rather than a pure developer console. The app should remain useful to a small trusted group, expose enough Image API controls for experimentation, and keep request/response details available without making them the primary interaction.

The core workflow should be iterative:

1. Generate an image from a prompt.
2. Pick a result.
3. Edit or refine that result.
4. Save useful outputs.
5. Keep enough local history to compare branches of work.

The minimum useful product is not just a static form. It must actually produce images in a normal setup, make successful outputs easy to save, and provide readable failures when generation does not work.

### Development implications

Future changes should optimize for these constraints:

- Prioritize a reliable generate-image path before adding more advanced controls.
- Keep the UI personal-tool polished: clear, compact, and pleasant, but not product/SaaS heavy.
- Keep advanced Image API parameters available because the user values control.
- Put request payloads and raw responses in a secondary debugging area, not in the main creative path.
- Support desktop, phone, and hosted use, but treat tablet PWA ergonomics as the main design target.
- Prefer OpenAI first while keeping provider-specific assumptions localized enough that OpenAI-compatible APIs remain plausible later.
- Add result download, local session history, and edit ancestry because output management is part of the target workflow.
- Show human-readable error summaries with raw details available underneath.

### Connection model implications

The app currently supports two request paths:

- Direct mode: the browser calls OpenAI directly and must provide an API key in the browser.
- Proxy mode: the browser calls a server controlled by the user, and that server forwards the request to OpenAI.

The proxy choice matters because it determines where the API key lives, where failures occur, and what deployment can work safely. A static GitHub Pages deployment can serve the frontend, but it cannot keep a shared OpenAI API key secret by itself. If the app should work for a trusted small group without every person handling their own key, it needs a proxy or another backend. If it is only a personal tool and direct browser use is acceptable, direct mode is simpler.

Until the authentication decision is settled, development should make the tradeoff explicit rather than hiding it behind an unexplained base URL. The next connection-related change should either document a working direct-call setup or add a small proxy path that makes local generation work out of the box.

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
