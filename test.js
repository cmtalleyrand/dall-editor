const assert = require("node:assert/strict");
const fs = require("node:fs");

const elements = new Map([
  ["transport", { value: "direct" }],
  ["baseUrl", { value: "" }],
  ["send", { addEventListener() {} }],
  ["installButton", { addEventListener() {}, hidden: true }],
  ["installStatus", { textContent: "" }],
  ["apiKey", { value: "" }],
  ["rememberKey", { checked: false }],
  ["outputFormat", { value: "webp" }],
  ["gallery", { innerHTML: "old", children: [], appendChild(node) { this.children.push(node); } }]
]);

global.document = {
  getElementById: (id) => elements.get(id) ?? { value: "", files: [], addEventListener() {} },
  createElement: (tag) => ({ tag, src: "" })
};
global.window = { addEventListener() {}, location: { origin: "http://app.example" } };
global.navigator = {};
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const { makeGenerationPayload, renderImages, resolveUrl } = require("./app.js");

renderImages({ data: [{ b64_json: "abc123" }] });
assert.equal(elements.get("gallery").children[0].src, "data:image/webp;base64,abc123");

assert.deepEqual(makeGenerationPayload({ model: "gpt-image-2", prompt: "x", response_format: "url", user: "" }), { model: "gpt-image-2", prompt: "x" });
assert.deepEqual(makeGenerationPayload({ model: "dall-e-3", prompt: "x", response_format: "url", user: "" }), { model: "dall-e-3", prompt: "x", response_format: "url" });

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
assert.match(html, /value="gpt-image-2"/);
assert.match(readme, /does not include an application backend/);
assert.doesNotMatch(readme, /node server\.js/);
assert.match(sw, /image-harness-v5/);
