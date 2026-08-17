var JobSearchOS = JobSearchOS || {};

// Deliberately fictional. Real preferences and job data must never be added here.
JobSearchOS.ExampleFixtures = {
  job: function (revision) {
    var updated = revision === "updated";
    return {
      company: "Example Circuits Cooperative",
      title: "Junior Signal Systems Engineer",
      normalized_location: "Beacon City, Northstar, Exampleland",
      source_type: "GITHUB",
      source_id: "example-source-row-001",
      source_url: "https://example.com/jobs/example-source-row-001?utm_source=fake",
      canonical_url: "https://careers.example.org/jobs/fictional-001",
      official_application_url: "https://careers.example.org/jobs/fictional-001",
      requisition_id: "EXAMPLE-REQ-001",
      posted_at: "2030-01-10",
      first_seen_at: "2030-01-11T08:00:00.000Z",
      overall_score: updated ? 82 : 72,
      technical_score: updated ? 88 : 78,
      visa_status: "MAYBE",
      new_grad_score: 90,
      location_tier: "PREFERRED",
      freshness_score: 100,
      interest_score: 70,
      flags: updated ? ["FAKE_FIXTURE", "UPDATED_FIXTURE"] : ["FAKE_FIXTURE"],
      daily_rank: 1,
      daily_batch: "2030-01-11",
      location_wildcard: false
    };
  }
};
