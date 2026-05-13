const $ = (id) => document.getElementById(id);
let deferredInstallPrompt = null;

function readFieldValues() {
  return {
    model: $("model").value,
    prompt: $("prompt").value,
    n: Number($("n").value),
    size: $("size").value,
    quality: $("quality").value,
    background: $("background").value,
    output_format: $("outputFormat").value,
    output_compression: Number($("outputCompression").value),
    moderation: $("moderation").value,
    response_format: $("responseFormat").value,
    user: $("user").value
  };
}

function isDallEModel(model) {
  return model.startsWith("dall-e-");
}

function makeImagePayload(fields, endpoint) {
  const payload = { ...fields };
  if (!payload.user) delete payload.user;

  if (!isDallEModel(payload.model)) {
    delete payload.response_format;
    return payload;
  }

  delete payload.background;
  delete payload.output_format;
  delete payload.output_compression;
  delete payload.moderation;
  if (endpoint === "edits") delete payload.quality;
  return payload;
}

function makeGenerationPayload(fields) {
  return makeImagePayload(fields, "generations");
}

function appendFormField(formData, key, value) {
  if (value === "" || value === undefined || value === null) return;
  formData.append(key, String(value));
}

async function makeEditFormData(fields) {
  const form = new FormData();
  const payload = makeImagePayload(fields, "edits");
  for (const [k, v] of Object.entries(payload)) appendFormField(form, k, v);
  const images = $("image").files;
  for (let i = 0; i < images.length; i += 1) form.append("image", images[i]);
  if ($("mask").files[0]) form.append("mask", $("mask").files[0]);
  return form;
}

function clearElement(node) {
  node.innerHTML = "";
  if (Array.isArray(node.children)) node.children.length = 0;
}

function makeDownloadName(index, format) {
  return `image-${new Date().toISOString().replace(/[:.]/g, "-")}-${index + 1}.${format}`;
}

function renderImages(data) {
  const gallery = $("gallery");
  clearElement(gallery);
  const images = data?.data ?? [];
  for (let i = 0; i < images.length; i += 1) {
    const item = images[i];
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const format = data.output_format || $("outputFormat").value || "png";
    const src = item.url ? item.url : `data:image/${format};base64,${item.b64_json}`;
    img.src = src;
    figure.appendChild(img);

    const link = document.createElement("a");
    link.href = src;
    link.textContent = "Save image";
    link.download = item.url ? "" : makeDownloadName(i, format);
    link.target = item.url ? "_blank" : "";
    link.rel = item.url ? "noopener" : "";
    figure.appendChild(link);
    gallery.appendChild(figure);
  }
}

function parseResponseBody(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
}

function summarizeError(data, fallbackText) {
  const error = data?.error;
  if (error?.message) {
    const pieces = [error.message];
    if (error.param) pieces.push(`Parameter: ${error.param}.`);
    if (error.code) pieces.push(`Code: ${error.code}.`);
    return pieces.join(" ");
  }
  return fallbackText || "Request failed before the app could read an error response.";
}

function updateStatus(message, isError = false) {
  const status = $("responseStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function maybeStoreKey() {
  if ($("rememberKey").checked) {
    sessionStorage.setItem("openai_api_key", $("apiKey").value);
  } else {
    sessionStorage.removeItem("openai_api_key");
  }
}

function resolveUrl(endpoint) {
  const transport = $("transport").value;
  const base = $("baseUrl").value.trim().replace(/\/$/, "");
  if (transport === "direct") return `https://api.openai.com/v1/images/${endpoint}`;
  if (!base) throw new Error("Base URL is required for custom endpoint mode.");
  return `${base}/v1/images/${endpoint}`;
}

async function sendRequest() {
  maybeStoreKey();
  const key = $("apiKey").value.trim();
  const endpoint = $("endpoint").value;
  const fields = readFieldValues();

  const url = resolveUrl(endpoint);
  let body;
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;

  if (endpoint === "generations") {
    body = JSON.stringify(makeGenerationPayload(fields));
    headers["Content-Type"] = "application/json";
    $("requestPreview").textContent = body;
  } else {
    body = await makeEditFormData(fields);
    $("requestPreview").textContent = "multipart/form-data payload (binary omitted)";
  }

  updateStatus("Sending request...");
  const resp = await fetch(url, { method: "POST", headers, body });
  const text = await resp.text();
  const data = parseResponseBody(text);
  $("rawResponse").textContent = JSON.stringify(data, null, 2);
  if (!resp.ok) {
    updateStatus(summarizeError(data, text), true);
    clearElement($("gallery"));
    return;
  }
  renderImages(data);
  updateStatus(data?.data?.length ? `Rendered ${data.data.length} image${data.data.length === 1 ? "" : "s"}.` : "Request succeeded, but no images were returned.");
}

function updateInstallStatus(message) {
  $("installStatus").textContent = message;
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("installButton").hidden = false;
  updateInstallStatus("Install is available. Tap Install app to add it to your home screen.");
});

$("installButton").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $("installButton").hidden = true;
  updateInstallStatus(choice.outcome === "accepted" ? "Install accepted." : "Install dismissed. You can still install from the browser menu.");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  $("installButton").hidden = true;
  updateInstallStatus("Installed. Launch it from your home screen or app launcher.");
});

$("send").addEventListener("click", () => {
  sendRequest().catch((err) => {
    updateStatus(String(err), true);
    $("rawResponse").textContent = `${String(err)}\n\nIf this says Failed to fetch, the browser did not receive an HTTP response. In direct mode, check network access to api.openai.com and browser policy. In custom endpoint mode, verify Base URL points at an endpoint you already operate.`;
  });
});

const cachedKey = sessionStorage.getItem("openai_api_key");
if (cachedKey) {
  $("apiKey").value = cachedKey;
  $("rememberKey").checked = true;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}

if (typeof module !== "undefined") {
  module.exports = { makeGenerationPayload, makeImagePayload, parseResponseBody, renderImages, resolveUrl, summarizeError };
}
