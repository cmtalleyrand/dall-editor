# Image API Harness

This project is a static Progressive Web App (PWA) for manually exercising the OpenAI Image API. It is a harness: it does not include an application backend, database, build system, job queue, or local proxy server.

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

Default settings:

1. **Transport**: `Direct OpenAI call`.
2. **Base URL**: ignored in direct mode.
3. **OpenAI API key**: required for direct mode.
4. **Endpoint**: `Generate` posts to `/v1/images/generations`; `Edit` posts to `/v1/images/edits`.

## Optional custom endpoint mode

Select **Custom compatible endpoint** only if you already operate an endpoint that accepts OpenAI-compatible Image API requests.

If **Base URL** is `https://gateway.example`, the app sends:

| UI endpoint | Browser request URL | Body type |
| --- | --- | --- |
| `Generate` | `https://gateway.example/v1/images/generations` | JSON |
| `Edit` | `https://gateway.example/v1/images/edits` | `multipart/form-data` |

The app validates that Base URL is non-empty before sending a custom-endpoint request. That validation is `O(1)` with respect to payload size because it only checks a short string field. Building a multipart edit request is `O(f)` in the number of selected files because each file reference is appended once.

## How the OpenAI Image API request works

The OpenAI Image API has separate endpoints for different image operations. See OpenAI's Image generation guide (`https://platform.openai.com/docs/guides/image-generation`) and Images API reference (`https://platform.openai.com/docs/api-reference/images/overview`) for the authoritative parameter list.

- **Generations** create new images from a text `prompt`.
- **Edits** modify existing images using uploaded image bytes plus a text `prompt`.
- **Variations** exist for DALL·E 2, but this harness intentionally exposes only generations and edits.

For generation, the browser sends JSON shaped like this:

```json
{
  "model": "gpt-image-2",
  "prompt": "A concise description of the desired image",
  "n": 1,
  "size": "auto",
  "quality": "auto",
  "background": "auto",
  "output_format": "png",
  "output_compression": 100,
  "moderation": "auto"
}
```

For edits, the browser sends `multipart/form-data` with the same scalar fields, plus:

- `image`: one or more source image files.
- `mask`: an optional mask image.

For GPT Image models, the Image API returns base64 image data by default. The harness omits `response_format` for `gpt-image-*` models because URL responses are unsupported for GPT Image models. The renderer expects the response to contain a top-level `data` array. Each item can contain either:

- `b64_json`, which the app renders as a `data:image/<selected-format>;base64,...` URL, or
- `url`, which the app assigns directly to an `<img>` element.

## Host on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. After you push the repository to GitHub, the workflow publishes the static app to GitHub Pages whenever `main` changes.

1. Push this repository to GitHub.
2. In GitHub, open **Settings → Pages** for the repository.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to the `main` branch, or run **Actions → Deploy static app to GitHub Pages → Run workflow**.
5. Open the deployment URL shown in the workflow summary. For a project repository, the URL is usually `https://<github-user-or-org>.github.io/<repository-name>/`.

GitHub Pages only serves static files. It does not keep API keys secret. Use it only as a manual harness with your own key in the browser, or point **Custom compatible endpoint** at infrastructure you control.

The workflow copies only the static runtime files into a `site/` directory before upload. There is no compile step; deployment work is linear in the number of copied files, which is currently a small fixed set plus the icon directory.

## Install on a tablet

1. Host this folder over HTTPS. For development only, `localhost` also works.
2. Open the hosted URL in Chrome, Edge, or Safari on the tablet.
3. In Chrome or Edge, choose **Install app** from the browser install prompt or menu.
4. In Safari on iPad, choose **Share → Add to Home Screen**.
5. Launch **Image API Harness** from the tablet home screen.

The installed app still calls the same hosted URL. It is a home-screen wrapper around the web app, with cached static files for faster startup.

The repository uses a text SVG icon rather than PNG binaries so the complete PR remains text-only.
