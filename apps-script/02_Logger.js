var JobSearchOS = JobSearchOS || {};

JobSearchOS.StructuredLogger = function (sink, minimumLevel) {
  this.sink_ = sink || function (record) {
    console.log(JSON.stringify(record));
  };
  this.minimumLevel_ = minimumLevel || "INFO";
};

JobSearchOS.StructuredLogger.prototype.info = function (event, context) {
  this.write_("INFO", event, context);
};

JobSearchOS.StructuredLogger.prototype.warn = function (event, context) {
  this.write_("WARN", event, context);
};

JobSearchOS.StructuredLogger.prototype.error = function (event, context) {
  this.write_("ERROR", event, context);
};

JobSearchOS.StructuredLogger.prototype.write_ = function (level, event, context) {
  var order = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
  if ((order[level] || 20) < (order[this.minimumLevel_] || 20)) return;

  var safeKeys = {
    action: true,
    code: true,
    component: true,
    count: true,
    dry_run: true,
    job_id: true,
    page_id_present: true,
    run_id: true,
    status: true
  };
  var safeContext = {};
  Object.keys(context || {}).forEach(function (key) {
    if (safeKeys[key]) safeContext[key] = context[key];
  });

  this.sink_({
    timestamp: new Date().toISOString(),
    level: level,
    event: String(event || "unspecified_event"),
    context: safeContext
  });
};

JobSearchOS.safeErrorMessage = function (error) {
  if (!error) return "Unknown error";
  var message = String(error.message || error);
  return message
    .replace(/secret_[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/ntn_[A-Za-z0-9_-]+/g, "[REDACTED]")
    .slice(0, 500);
};
