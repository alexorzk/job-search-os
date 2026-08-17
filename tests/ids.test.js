const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRuntime, readFixture } = require("./helpers/runtime");

test("stable job IDs are repeatable and ignore tracking-only URL changes", () => {
  const os = loadRuntime();
  const job = readFixture("example-job.json");
  delete job.requisition_id;
  const first = os.stableJobId(job);
  const second = os.stableJobId({ ...job, source_url: `${job.source_url}&utm_campaign=ignored` });
  assert.equal(first, second);
  assert.match(first, /^job_[a-f0-9]{24}$/);
});

test("requisition identity takes precedence and changes deterministically", () => {
  const os = loadRuntime();
  const job = readFixture("example-job.json");
  assert.equal(os.stableJobId(job), os.stableJobId({ ...job }));
  assert.notEqual(os.stableJobId(job), os.stableJobId({ ...job, requisition_id: "EXAMPLE-REQ-002" }));
});

test("stable job ID rejects incomplete identity", () => {
  const os = loadRuntime();
  assert.throws(() => os.stableJobId({ company: "Example Co" }), /company and title are required/);
});
