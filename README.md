# Image API Harness

This project is a static Progressive Web App (PWA) for manually exercising the OpenAI Image API. It is a harness: it does not include an application backend, database, build system, job queue, or local proxy server.

The app collects form fields in the browser, builds either a JSON request or a `multipart/form-data` request, sends that request to a selected Image API endpoint, and renders each returned image from either `b64_json` or `url`. For `k` returned images, rendering is `O(k)` because the app creates one `<img>` element per response item.

## Why `TypeError: Failed to fetch` happened

`TypeError: Failed to fetch` is a browser network failure. Formally, JavaScript did not receive an HTTP response object. That differs from an OpenAI API response such as HTTP `400`, `401`, or `429`, where the server returns JSON and the app can display it.

The previous default selected a local proxy URL even though this repository is only a static harness. If nothing is listening at that URL, the browser cannot complete the TCP/HTTP request, so `fetch` rejects with `TypeError: Failed to fetch` before the app can show an API error body.

The app now defaults to **Direct OpenAI call**, which attempts a browser request to `https://api.openai.com/v1/images/<endpoint>`. This is a valid harness behavior, but it is not a production application architecture: browser policy can still block the request, and the browser necessarily sees the API key. A second transport, **Custom compatible endpoint**, remains available for users who already have their own compatible gateway; because this repository is a harness, it does not create that gateway for you.

## Security boundary

Direct mode places the API key in browser memory and sends it from the browser. OpenAI's authentication documentation says API keys should not be exposed in client-side code; see `https://platform.openai.com/docs/api-reference/authentication`. Therefore, direct mode is only a personal/local harness mode. For shared, production, or untrusted-user deployments, use your own server-side gateway and select **Custom compatible endpoint**. If direct mode produces `TypeError: Failed to fetch`, the static files are working but the browser did not allow the cross-origin API request to complete.

## Local static run

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
