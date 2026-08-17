var JobSearchOS = JobSearchOS || {};

JobSearchOS.FoundationService = function (options) {
  this.dryRun_ = Boolean(options.dryRun);
  this.staging_ = options.staging || null;
  this.notion_ = options.notion;
  this.logger_ = options.logger || new JobSearchOS.StructuredLogger();
  this.clock_ = options.clock || function () { return new Date().toISOString(); };
};

JobSearchOS.FoundationService.prototype.processJob = function (inputJob) {
  var job = Object.assign({}, inputJob);
  job.job_id = job.job_id || JobSearchOS.stableJobId(job);
  job.last_seen_at = job.last_seen_at || this.clock_();

  if (this.dryRun_) {
    var plan = this.notion_.upsertJob(job);
    this.logger_.info("foundation_job_planned", { job_id: job.job_id, dry_run: true, action: plan.action });
    return { job_id: job.job_id, staging: "planned", notion: plan };
  }
  if (!this.staging_) throw new Error("STAGING_CONFIG_INVALID: live runs require a staging store");

  try {
    var stagingResult = this.staging_.upsertCandidate(job);
    var notionResult = this.notion_.upsertJob(job);
    this.staging_.markPromoted(job.job_id, notionResult.page_id);
    this.logger_.info("foundation_job_processed", {
      job_id: job.job_id,
      action: notionResult.action,
      status: "PROMOTED"
    });
    return { job_id: job.job_id, staging: stagingResult, notion: notionResult };
  } catch (error) {
    try {
      this.staging_.recordError({
        job_id: job.job_id,
        component: "FOUNDATION",
        code: error.code || "FOUNDATION_FAILED",
        message: JobSearchOS.safeErrorMessage(error)
      });
    } catch (ignored) {
      this.logger_.error("foundation_error_record_failed", { job_id: job.job_id, code: "ERROR_RECORD_FAILED" });
    }
    throw error;
  }
};
