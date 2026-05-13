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

function makeGenerationPayload(fields) {
  const payload = { ...fields };
  if (!payload.user) delete payload.user;
  if (payload.model.startsWith("gpt-image-")) delete payload.response_format;
  return payload;
}

function appendFormField(formData, key, value) {
  if (value === "" || value === undefined || value === null) return;
  formData.append(key, String(value));
}

async function makeEditFormData(fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (k !== "response_format") appendFormField(form, k, v);
  }
  const images = $("image").files;
  for (let i = 0; i < images.length; i += 1) form.append("image", images[i]);
  if ($("mask").files[0]) form.append("mask", $("mask").files[0]);
  return form;
}

function renderImages(data) {
  const gallery = $("gallery");
  gallery.innerHTML = "";
  const images = data?.data ?? [];
  for (let i = 0; i < images.length; i += 1) {
    const item = images[i];
    const img = document.createElement("img");
    const format = $("outputFormat").value || "png";
    img.src = item.url ? item.url : `data:image/${format};base64,${item.b64_json}`;
    gallery.appendChild(img);
  }
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

  const resp = await fetch(url, { method: "POST", headers, body });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  $("rawResponse").textContent = JSON.stringify(data, null, 2);
  renderImages(data);
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
  module.exports = { makeGenerationPayload, renderImages, resolveUrl };
}
