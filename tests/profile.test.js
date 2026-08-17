const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadRuntime, readFixture } = require("./helpers/runtime");

test("fake profile passes runtime validation and public JSON schema declares required structures", () => {
  const os = loadRuntime();
  const profile = readFixture("example-profile.json");
  assert.equal(os.Profile.validate(profile), profile);

  const schema = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, "..", "schemas", "user-profile.schema.json"),
    "utf8"
  ));
  assert.ok(schema.required.includes("location_preferences"));
  assert.ok(schema.required.includes("work_authorization"));
  assert.deepEqual(schema.$defs.locationTier.enum, ["PREFERRED", "ACCEPTABLE", "LOW_INTEREST", "HARD_NO"]);
});

test("more-specific city, metro, and state rules override broader rules", () => {
  const os = loadRuntime();
  const profile = readFixture("example-profile.json");

  assert.equal(os.Profile.resolveLocation(profile, {
    country: "Exampleland", state: "Northstar", metro: "Aurora Metro", city: "Beacon City", work_mode: "HYBRID"
  }).tier, "PREFERRED");
  assert.equal(os.Profile.resolveLocation(profile, {
    country: "Exampleland", state: "Northstar", metro: "Aurora Metro", city: "Remote Hamlet", work_mode: "ONSITE"
  }).tier, "LOW_INTEREST");
  assert.equal(os.Profile.resolveLocation(profile, {
    country: "Exampleland", state: "Northstar", city: "Somewhere", work_mode: "ONSITE"
  }).tier, "ACCEPTABLE");
  assert.equal(os.Profile.resolveLocation(profile, {
    country: "Exampleland", state: "Elsewhere", work_mode: "ONSITE"
  }).tier, "LOW_INTEREST");
});

test("remote, unknown, and multi-location rules are deterministic", () => {
  const os = loadRuntime();
  const profile = readFixture("example-profile.json");
  assert.equal(os.Profile.resolveLocation(profile, { work_mode: "REMOTE" }).tier, "ACCEPTABLE");
  assert.equal(os.Profile.resolveLocation(profile, { work_mode: "UNKNOWN" }).requires_review, true);

  const multi = os.Profile.resolveMultipleLocations(profile, [
    { country: "Exampleland", state: "Elsewhere", work_mode: "ONSITE" },
    { country: "Exampleland", state: "Northstar", metro: "Aurora Metro", work_mode: "HYBRID" }
  ]);
  assert.equal(multi.tier, "PREFERRED");
});

test("invalid profile fields are rejected conservatively", () => {
  const os = loadRuntime();
  const profile = readFixture("example-profile.json");
  profile.location_preferences.rules[0].tier = "MAGIC";
  profile.work_authorization.requires_future_sponsorship = "ASSUMED";
  assert.throws(() => os.Profile.validate(profile), /PROFILE_INVALID/);
});
