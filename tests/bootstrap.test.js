const test = require("node:test");
const assert = require("node:assert/strict");
const { MemoryPropertyStore, loadRuntime } = require("./helpers/runtime");

class FakeRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }
  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from({ length: this.columnCount }, (_, columnOffset) =>
        this.sheet.values[this.row - 1 + rowOffset]?.[this.column - 1 + columnOffset] ?? ""
      )
    );
  }
  setValues(values) {
    values.forEach((row, rowOffset) => {
      const targetRow = this.row - 1 + rowOffset;
      this.sheet.values[targetRow] ??= [];
      row.forEach((value, columnOffset) => {
        this.sheet.values[targetRow][this.column - 1 + columnOffset] = value;
      });
    });
    return this;
  }
}

class FakeSheet {
  constructor(name) { this.name = name; this.values = []; }
  getLastColumn() { return this.values.reduce((max, row) => Math.max(max, row.length), 0); }
  getLastRow() { return this.values.length; }
  getRange(row, column, rowCount, columnCount) { return new FakeRange(this, row, column, rowCount, columnCount); }
  setFrozenRows() {}
  appendRow(row) { this.values.push([...row]); }
}

class FakeSpreadsheet {
  constructor(id) { this.id = id; this.sheets = new Map(); }
  getId() { return this.id; }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) { const sheet = new FakeSheet(name); this.sheets.set(name, sheet); return sheet; }
}

class FakeSpreadsheetApp {
  constructor() { this.created = []; this.byId = new Map(); }
  create() {
    const sheet = new FakeSpreadsheet(`fake-sheet-${this.created.length + 1}`);
    this.created.push(sheet);
    this.byId.set(sheet.getId(), sheet);
    return sheet;
  }
  openById(id) { return this.byId.get(id); }
}

class FakeNotionAdminTransport {
  constructor() { this.requests = []; }
  request(method, pathName, body) {
    this.requests.push({ method, path: pathName, body: structuredClone(body) });
    if (method === "POST" && pathName === "/databases") {
      const index = this.requests.filter((request) => request.method === "POST").length;
      return { id: `fake-db-${index}`, data_sources: [{ id: `fake-ds-${index}`, name: "Fake" }] };
    }
    throw new Error(`Unhandled fake admin request: ${method} ${pathName}`);
  }
}

test("private bootstrap creates one Sheet and three Notion databases, then reruns without duplication", () => {
  const os = loadRuntime();
  const properties = new MemoryPropertyStore({
    NOTION_TOKEN: "unit-test-token",
    NOTION_PARENT_PAGE_ID: "unit-test-parent-id"
  });
  const spreadsheetApp = new FakeSpreadsheetApp();
  const notionTransport = new FakeNotionAdminTransport();
  const logger = new os.StructuredLogger(() => {});

  const first = os.Bootstrap.createPrivateFoundation({
    propertyStore: properties,
    spreadsheetApp,
    notionTransport,
    logger
  });
  const second = os.Bootstrap.createPrivateFoundation({
    propertyStore: properties,
    spreadsheetApp,
    notionTransport,
    logger
  });

  assert.equal(first.jobsConfigured, true);
  assert.equal(second.jobsConfigured, true);
  assert.equal(spreadsheetApp.created.length, 1);
  assert.equal(spreadsheetApp.created[0].sheets.size, 5);
  assert.equal(notionTransport.requests.length, 3);
  assert.equal(properties.getProperty("NOTION_JOBS_DATA_SOURCE_ID"), "fake-ds-3");

  const jobsRequest = notionTransport.requests[2];
  assert.equal(
    jobsRequest.body.initial_data_source.properties["Selected Resume"].relation.data_source_id,
    "fake-ds-2"
  );
});
