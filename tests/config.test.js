const test = require("node:test");
const assert = require("node:assert/strict");
const { MemoryPropertyStore, loadRuntime } = require("./helpers/runtime");

test("safe defaults do not overwrite existing Script Properties", () => {
  const os = loadRuntime();
  const store = new MemoryPropertyStore({ DRY_RUN: "false", LOG_LEVEL: "WARN" });
  const added = os.Config.initializeDefaults(store);

  assert.equal(store.getProperty("DRY_RUN"), "false");
  assert.equal(store.getProperty("LOG_LEVEL"), "WARN");
  assert.equal(store.getProperty("NOTION_API_VERSION"), "2026-03-11");
  assert.equal(added.DRY_RUN, undefined);
});

test("live runtime configuration requires private IDs and token", () => {
  const os = loadRuntime();
  const store = new MemoryPropertyStore({ DRY_RUN: "false" });
  const config = os.Config.load(store);
  assert.throws(() => os.Config.validate(config, "runtime"), /notionToken is required/);
  assert.throws(() => os.Config.validate(config, "runtime"), /stagingSheetId is required/);
});

test("dry-run runtime validates without live credentials", () => {
  const os = loadRuntime();
  const config = os.Config.load(new MemoryPropertyStore({ DRY_RUN: "true" }));
  assert.equal(os.Config.validate(config, "runtime").dryRun, true);
});

test("invalid booleans and placeholders fail validation", () => {
  const os = loadRuntime();
  assert.throws(
    () => os.Config.load(new MemoryPropertyStore({ DRY_RUN: "sometimes" })),
    /DRY_RUN must be true or false/
  );
  const config = os.Config.load(new MemoryPropertyStore({
    DRY_RUN: "false",
    NOTION_TOKEN: "replace_me",
    NOTION_JOBS_DATA_SOURCE_ID: "replace_me",
    STAGING_SHEET_ID: "replace_me"
  }));
  assert.throws(() => os.Config.validate(config, "runtime"), /placeholder/);
});
