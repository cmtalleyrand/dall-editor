const assert = require("node:assert/strict");
const fs = require("node:fs");

function makeNode(tag) {
  return {
    tag,
    src: "",
    href: "",
    textContent: "",
    download: "",
    target: "",
    rel: "",
    children: [],
    appendChild(node) { this.children.push(node); }
  };
}

const elements = new Map([
  ["transport", { value: "direct" }],
  ["baseUrl", { value: "" }],
  ["send", { addEventListener() {} }],
  ["installButton", { addEventListener() {}, hidden: true }],
  ["installStatus", { textContent: "" }],
  ["responseStatus", { textContent: "", classList: { toggle() {} } }],
  ["apiKey", { value: "" }],
  ["rememberKey", { checked: false }],
  ["outputFormat", { value: "webp" }],
  ["gallery", { innerHTML: "old", children: [], appendChild(node) { this.children.push(node); } }]
]);

global.document = {
  getElementById: (id) => elements.get(id) ?? { value: "", files: [], addEventListener() {} },
  createElement: makeNode
};
global.window = { addEventListener() {}, location: { origin: "http://app.example" } };
global.navigator = {};
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const { makeGenerationPayload, makeImagePayload, parseResponseBody, renderImages, resolveUrl, summarizeError } = require("./app.js");

renderImages({ output_format: "png", data: [{ b64_json: "abc123" }] });
const figure = elements.get("gallery").children[0];
assert.equal(figure.children[0].src, "data:image/png;base64,abc123");
assert.equal(figure.children[1].textContent, "Save image");
assert.match(figure.children[1].download, /^image-.*-1\.png$/);

assert.deepEqual(makeGenerationPayload({ model: "gpt-image-1.5", prompt: "x", response_format: "url", user: "" }), { model: "gpt-image-1.5", prompt: "x" });
assert.deepEqual(makeGenerationPayload({ model: "chatgpt-image-latest", prompt: "x", response_format: "url", user: "" }), { model: "chatgpt-image-latest", prompt: "x" });
assert.deepEqual(
  makeGenerationPayload({ model: "dall-e-3", prompt: "x", response_format: "url", background: "auto", output_format: "png", output_compression: 100, moderation: "auto", user: "" }),
  { model: "dall-e-3", prompt: "x", response_format: "url" }
);
assert.deepEqual(
  makeImagePayload({ model: "dall-e-2", prompt: "x", response_format: "b64_json", quality: "auto", background: "auto" }, "edits"),
  { model: "dall-e-2", prompt: "x", response_format: "b64_json" }
);
assert.equal(summarizeError({ error: { message: "Unknown parameter: 'response_format'.", param: "response_format", code: "unknown_parameter" } }), "Unknown parameter: 'response_format'. Parameter: response_format. Code: unknown_parameter.");
assert.deepEqual(parseResponseBody("not json"), { error: { message: "not json" } });

assert.equal(resolveUrl("generations"), "https://api.openai.com/v1/images/generations");
assert.equal(resolveUrl("edits"), "https://api.openai.com/v1/images/edits");

elements.get("transport").value = "proxy";
assert.throws(() => resolveUrl("generations"), /Base URL is required/);
elements.get("baseUrl").value = "https://gateway.example/";
assert.equal(resolveUrl("generations"), "https://gateway.example/v1/images/generations");

const html = fs.readFileSync("index.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
assert.match(html, /<option value="direct">Direct OpenAI call<\/option>/);
assert.ok(html.indexOf('value="direct"') < html.indexOf('value="proxy"'));
assert.match(html, /Custom compatible endpoint/);
assert.match(html, /value="gpt-image-1\.5"/);
assert.match(html, /id="responseStatus"/);
assert.match(readme, /does not include an application backend/);
assert.match(readme, /omits `response_format` unless the model name starts with `dall-e-`/);
assert.doesNotMatch(readme, /node server\.js/);
assert.match(sw, /image-harness-v6/);
