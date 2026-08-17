var JobSearchOS = JobSearchOS || {};

JobSearchOS.normalizeIdentityText = function (value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

JobSearchOS.normalizeUrlForIdentity = function (value) {
  var input = String(value || "").trim();
  if (!input) return "";
  var parts = input.split("#")[0].split("?");
  var base = parts[0].replace(/\/$/, "").toLowerCase();
  if (parts.length === 1) return base;

  var ignored = /^(utm_|source$|ref$|referrer$|trk$|tracking|gh_src$|mc_)/i;
  var query = parts.slice(1).join("?").split("&").filter(function (pair) {
    var key = decodeURIComponent((pair.split("=")[0] || "").replace(/\+/g, " "));
    return key && !ignored.test(key);
  }).sort();
  return query.length ? base + "?" + query.join("&") : base;
};

JobSearchOS.sha256Hex = function (value) {
  if (typeof Utilities === "undefined" || !Utilities.computeDigest) {
    throw new Error("RUNTIME_MISSING: Utilities.computeDigest is required");
  }
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ("0" + normalized.toString(16)).slice(-2);
  }).join("");
};

JobSearchOS.stableJobId = function (job) {
  if (!job || !job.company || !job.title) {
    throw new Error("JOB_ID_INVALID: company and title are required");
  }
  var company = JobSearchOS.normalizeIdentityText(job.company);
  var basis;
  if (job.requisition_id) {
    basis = "req|" + company + "|" + JobSearchOS.normalizeIdentityText(job.requisition_id);
  } else {
    var url = JobSearchOS.normalizeUrlForIdentity(
      job.official_application_url || job.canonical_url || job.source_url
    );
    if (url) {
      basis = "url|" + url;
    } else {
      basis = [
        "fallback",
        company,
        JobSearchOS.normalizeIdentityText(job.title),
        JobSearchOS.normalizeIdentityText(job.normalized_location)
      ].join("|");
    }
  }
  return "job_" + JobSearchOS.sha256Hex(basis).slice(0, 24);
};

JobSearchOS.stableRunId = function (startedAt, label) {
  return "run_" + JobSearchOS.sha256Hex(String(startedAt) + "|" + String(label || "run")).slice(0, 20);
};
