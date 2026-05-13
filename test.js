const assert = require("node:assert/strict");

const elements = new Map([
  ["transport", { value: "proxy" }],
  ["baseUrl", { value: "http://localhost:8787/" }],
  ["send", { addEventListener() {} }],
  ["installButton", { addEventListener() {}, hidden: true }],
  ["installStatus", { textContent: "" }],
  ["apiKey", { value: "" }],
  ["rememberKey", { checked: false }]
]);

global.document = { getElementById: (id) => elements.get(id) ?? { value: "", files: [], addEventListener() {} } };
global.window = { addEventListener() {} };
global.navigator = {};
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const { resolveUrl } = require("./app.js");

assert.equal(resolveUrl("generations"), "http://localhost:8787/v1/images/generations");
elements.get("transport").value = "direct";
assert.equal(resolveUrl("edits"), "https://api.openai.com/v1/images/edits");
