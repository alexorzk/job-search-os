const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT_FILES = [
  "00_Namespace.js",
  "01_Constants.js",
  "02_Logger.js",
  "03_Config.js",
  "04_Ids.js",
  "05_Profile.js",
  "06_Staging.js",
  "07_NotionSchemas.js",
  "08_NotionClient.js",
  "09_FoundationService.js",
  "10_ExampleFixtures.js",
  "11_Bootstrap.js",
  "12_Entrypoints.js"
];

function loadRuntime() {
  const context = vm.createContext({
    console,
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF_8" },
      computeDigest(_algorithm, value) {
        return Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest())
          .map((byte) => (byte > 127 ? byte - 256 : byte));
      }
    }
  });
  for (const file of SCRIPT_FILES) {
    const source = fs.readFileSync(path.join(ROOT, "apps-script", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context.JobSearchOS;
}

class MemoryPropertyStore {
  constructor(initial = {}) {
    this.values = { ...initial };
  }
  getProperties() { return { ...this.values }; }
  getProperty(key) { return this.values[key] ?? null; }
  setProperty(key, value) { this.values[key] = String(value); return this; }
  setProperties(values, deleteAllOthers = false) {
    if (deleteAllOthers) this.values = {};
    for (const [key, value] of Object.entries(values)) this.values[key] = String(value);
    return this;
  }
}

class MemoryTableAdapter {
  constructor() {
    this.tables = new Map();
  }
  ensureTable(name, headers) {
    if (!this.tables.has(name)) this.tables.set(name, { headers: [...headers], rows: [] });
    const table = this.tables.get(name);
    if (JSON.stringify(table.headers) !== JSON.stringify(headers)) throw new Error(`schema mismatch: ${name}`);
  }
  readRows(name) {
    const table = this.tables.get(name);
    if (!table) throw new Error(`missing table: ${name}`);
    return table.rows.map((row, index) => ({ ...row, _rowNumber: index + 2 }));
  }
  appendRow(name, _headers, record) {
    const table = this.tables.get(name);
    table.rows.push({ ...record });
    return table.rows.length + 1;
  }
  updateRow(name, _headers, rowNumber, record) {
    this.tables.get(name).rows[rowNumber - 2] = { ...record };
  }
}

class FakeNotionTransport {
  constructor() {
    this.pages = [];
    this.requests = [];
  }
  request(method, pathName, body) {
    this.requests.push({ method, path: pathName, body: structuredClone(body) });
    if (method === "POST" && /\/data_sources\/[^/]+\/query$/.test(pathName)) {
      const expected = body.filter.rich_text.equals;
      return {
        results: this.pages.filter((page) => richText(page.properties["Job ID"]) === expected)
          .map((page) => structuredClone(page))
      };
    }
    if (method === "POST" && pathName === "/pages") {
      const page = { id: `fake-page-${this.pages.length + 1}`, properties: structuredClone(body.properties) };
      this.pages.push(page);
      return structuredClone(page);
    }
    if (method === "PATCH" && pathName.startsWith("/pages/")) {
      const id = decodeURIComponent(pathName.slice("/pages/".length));
      const page = this.pages.find((candidate) => candidate.id === id);
      if (!page) throw new Error(`fake page not found: ${id}`);
      page.properties = { ...page.properties, ...structuredClone(body.properties) };
      return structuredClone(page);
    }
    throw new Error(`Unhandled fake Notion request: ${method} ${pathName}`);
  }
  manuallyEdit(pageId, properties) {
    const page = this.pages.find((candidate) => candidate.id === pageId);
    page.properties = { ...page.properties, ...structuredClone(properties) };
  }
}

function richText(property) {
  return property?.rich_text?.[0]?.text?.content ?? "";
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures", name), "utf8"));
}

module.exports = {
  FakeNotionTransport,
  MemoryPropertyStore,
  MemoryTableAdapter,
  loadRuntime,
  readFixture,
  richText
};
