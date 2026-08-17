const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FakeNotionTransport,
  MemoryTableAdapter,
  loadRuntime,
  readFixture,
  richText
} = require("./helpers/runtime");

function makeFoundation() {
  const os = loadRuntime();
  const adapter = new MemoryTableAdapter();
  const logger = new os.StructuredLogger(() => {});
  const staging = new os.StagingStore(adapter, logger, () => "2030-01-11T12:00:00.000Z");
  staging.ensureSchema();
  const transport = new FakeNotionTransport();
  const notion = new os.NotionClient(transport, {
    jobsDataSourceId: "fake-jobs-data-source",
    dryRun: false,
    logger,
    clock: () => "2030-01-11T12:00:00.000Z"
  });
  const service = new os.FoundationService({
    dryRun: false,
    staging,
    notion,
    logger,
    clock: () => "2030-01-11T12:00:00.000Z"
  });
  return { os, adapter, staging, transport, notion, service };
}

test("fake job stages, promotes, reruns idempotently, updates automation fields, and preserves user fields", () => {
  const { os, adapter, staging, transport, service } = makeFoundation();
  const initial = readFixture("example-job.json");
  const first = service.processJob(initial);
  assert.equal(first.notion.action, "created");
  assert.equal(transport.pages.length, 1);
  assert.equal(staging.getCandidate(first.job_id).processing_status, "PROMOTED");

  transport.manuallyEdit(first.notion.page_id, {
    Stage: { select: { name: "SAVED" } },
    Notes: { rich_text: [{ type: "text", text: { content: "Manual private note" } }] }
  });
  const updated = { ...initial, overall_score: 82, technical_score: 88, flags: ["FAKE_FIXTURE", "UPDATED"] };
  const second = service.processJob(updated);

  assert.equal(second.job_id, first.job_id);
  assert.equal(second.notion.action, "updated");
  assert.equal(transport.pages.length, 1);
  assert.equal(transport.pages[0].properties["Overall Score"].number, 82);
  assert.equal(transport.pages[0].properties.Stage.select.name, "SAVED");
  assert.equal(richText(transport.pages[0].properties.Notes), "Manual private note");
  assert.equal(adapter.tables.get("Candidates").rows.length, 1);

  const patch = transport.requests.find((request) => request.method === "PATCH");
  const patchedNames = Object.keys(patch.body.properties);
  assert.equal(patchedNames.some((name) => os.Constants.USER_OWNED_JOB_PROPERTIES.includes(name)), false);
  assert.ok(patchedNames.every((name) => os.Constants.AUTOMATION_OWNED_JOB_PROPERTIES.includes(name)));
});

test("staging candidate and checkpoint upserts are idempotent", () => {
  const { os, adapter, staging } = makeFoundation();
  const job = readFixture("example-job.json");
  job.job_id = os.stableJobId(job);
  staging.upsertCandidate(job);
  staging.upsertCandidate({ ...job, processing_status: "READY" });
  staging.setCheckpoint("fake-source", "one");
  staging.setCheckpoint("fake-source", "two");

  assert.equal(adapter.tables.get("Candidates").rows.length, 1);
  assert.equal(staging.getCandidate(job.job_id).processing_status, "READY");
  assert.equal(adapter.tables.get("Checkpoints").rows.length, 1);
  assert.equal(staging.getCheckpoint("fake-source"), "two");
});

test("dry run plans without staging or Notion writes", () => {
  const os = loadRuntime();
  const transport = new FakeNotionTransport();
  const logger = new os.StructuredLogger(() => {});
  const notion = new os.NotionClient(transport, { dryRun: true, logger });
  const service = new os.FoundationService({ dryRun: true, staging: null, notion, logger });
  const result = service.processJob(readFixture("example-job.json"));
  assert.equal(result.notion.action, "planned");
  assert.equal(transport.requests.length, 0);
});

test("ownership lists are disjoint", () => {
  const os = loadRuntime();
  const overlap = os.Constants.AUTOMATION_OWNED_JOB_PROPERTIES.filter((name) =>
    os.Constants.USER_OWNED_JOB_PROPERTIES.includes(name)
  );
  assert.equal(overlap.length, 0);
});
