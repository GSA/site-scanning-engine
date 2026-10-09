---
title: Site Scanning Risks and Maintenance Guide
description: Technical and program risk register, controls, impact analysis, and maintenance model.
status: draft
tier: 2
last_updated: 2026-10-09
---

# Risks And Maintenance Guide

## 1. Purpose

This document identifies observed risks and establishes a maintenance approach
for the Site Scanning product. It is not an authorization decision or a claim
that a listed risk is currently causing an incident. Risk owners and acceptance
decisions must be assigned by program leadership.

Priority follows safety, correctness, compliance, simplicity, then performance.

## 2. Risk Scale

- **Probability:** Low, Medium, High likelihood within the planning horizon.
- **Impact:** Low, Medium, High effect on mission, data integrity, security,
  availability, compliance, or trust.
- **Priority:** Critical, High, Medium, Low based on combined exposure and
  urgency.

## 3. Risk Register

| ID  | Risk                                                                                                                                | Probability | Impact | Priority | Control or mitigation                                                                                                       | Trigger                                                     | Accountable role                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| R1  | TypeORM `synchronize: true` alters production schema at application startup without versioned migration/rollback evidence           | Medium      | High   | High     | Adopt reviewed migrations, backup/restore validation, and deployment schema gates                                           | Entity change or unexpected startup DDL/data loss           | Technical lead and database owner |
| R2  | Operational database preserves only the latest result, limiting audit, trend analysis, and recovery from bad scans                  | High        | Medium | High     | Make archived snapshots an explicit historical product or design append-only history                                        | Monitoring/trend request or bad run overwrites trusted data | Data product owner                |
| R3  | API, serialized entities, snapshots, data dictionary, and Swagger DTO can drift                                                     | High        | High   | Critical | Generate/validate contracts from one manifest; add cross-surface contract tests and release checks                          | Field addition, rename, query failure, consumer report      | API and data contract owner       |
| R4  | `scan_status` API filter queries nonexistent `coreResult.status`                                                                    | High        | Medium | High     | Correct to an explicitly defined status field or reject/deprecate the filter; add integration test                          | Any `scan_status` request                                   | API owner                         |
| R5  | No explicit database indexes were found for frequent URL, date, status, ownership, and domain filters                               | Medium      | Medium | Medium   | Capture query plans and latency; add only evidence-backed indexes through migrations                                        | Query latency or table growth threshold exceeded            | Database owner                    |
| R6  | Local S3/Minio services are commented out, making snapshot publication difficult to test end to end                                 | High        | Medium | High     | Restore supported local object storage or a documented isolated test bucket and integration test                            | Snapshot format/archive change                              | Snapshot owner                    |
| R7  | Browser scanning untrusted sites is resource-intensive and exposes the worker to hostile or pathological content                    | Medium      | High   | High     | Maintain isolation, request controls, timeouts, dependency updates, resource limits, and incident runbook                   | Browser escape advisory, repeated crashes, resource spike   | Security and operations leads     |
| R8  | Seven workers with fixed concurrency provide finite throughput; scan duration/load growth can create stale data                     | Medium      | Medium | Medium   | Measure queue age and scan duration; capacity test before adding scans; tune concurrency based on evidence                  | Queue age/freshness SLO breached                            | Operations lead                   |
| R9  | Daily worker restart may mask memory/resource defects and creates scheduled interruption                                            | Medium      | Medium | Medium   | Trend memory and browser lifecycle metrics; diagnose before relying on restart as primary control                           | Restart frequency rises or jobs stall around restart        | Technical operations lead         |
| R10 | External Website Index, CISA data, GitHub API, public websites, and GitHub Actions are upstream dependencies outside direct control | High        | Medium | High     | Validate inputs, record provenance/freshness, alert on source failure, retain last-known-good data, document degraded modes | Fetch/schema/freshness failure                              | Source integration owner          |
| R11 | A missing security-data row can be misread as a website security failure                                                            | High        | Medium | High     | Distinguish not-covered from failed/insecure in status and reports                                                          | Security report or outreach generated                       | Data definition owner             |
| R12 | Heuristic detections can produce false positives/negatives and be presented as compliance judgments                                 | High        | High   | Critical | Publish methods/caveats, validate samples, measure detector quality, require human review for consequential use             | Public ranking, enforcement, or direct remediation outreach | Product and domain owners         |
| R13 | Wide flat schema increases change surface and sparse-field complexity                                                               | High        | Medium | Medium   | Use field-change checklist and contract manifest; consider scan-specific storage only with proven need                      | Field growth or migration effort rises materially           | Technical lead                    |
| R14 | Public CSV truncates long list values while JSON does not                                                                           | High        | Low    | Medium   | Document limit, direct complete-data users to JSON, expose truncation metadata if decisions depend on completeness          | Consumer uses CSV lists for exhaustive analysis             | Data product owner                |
| R15 | Source and program documentation contain stale schedules, names, and architecture                                                   | High        | Medium | High     | Assign document owners, verify against code/workflows quarterly, use generated references where possible                    | Workflow, field, or deployment change                       | Documentation owner               |
| R16 | `client-redirect.ts` is exported but not wired to the page enum/dispatcher, creating ambiguity and dead maintenance surface         | Medium      | Low    | Low      | Confirm intent, then wire with tests or remove in a scoped change                                                           | Related redirect requirement or refactor                    | Core scanner owner                |
| R17 | Small-team staffing creates concentration and continuity risk across engineering, product, operations, outreach, and ATO work       | High        | High   | Critical | Define role backups, runbooks, service priorities, WIP limits, and succession/onboarding material                           | Key-person absence or concurrent urgent work                | Program sponsor                   |
| R18 | ATO renewal/material-change work can compete with feature demand or lag architecture changes                                        | Medium      | High   | High     | Integrate security review into roadmap, maintain evidence continuously, classify material changes early                     | Dependency/platform/architecture/security change            | System owner and ISSO             |
| R19 | Dependency versions use ranges in `package.json`, and browser/Nest/AWS dependency changes can be broad                              | Medium      | High   | High     | Rely on lockfile, controlled updates, SCA/SAST, release tests, and rollback; assess production pinning policy               | High-severity advisory or major update                      | Technical and security leads      |
| R20 | GitHub Actions and Cloud Foundry split scheduling and execution state, complicating diagnosis                                       | Medium      | Medium | Medium   | Maintain one stage map, correlation IDs, observed-output checks, and runbooks across systems                                | Scheduled task timeout or ambiguous completion              | Operations lead                   |

## 4. Highest-Priority Controls

### 4.1 Public Contract Control

Create a machine-readable field manifest containing public name, type,
nullability, source scan, publication paths, queryability, and definition. Use
it to check:

- Entity `@Expose` names.
- `snapshotColumnOrder`.
- Runtime API response keys.
- OpenAPI schema.
- Data dictionary field IDs.
- CSV and JSON headers.

Fail builds on unexplained drift. This directly controls R3, R4, R12, R14, and
R15.

### 4.2 Schema Change Control

Before the next entity change, decide whether production will continue to use
automatic synchronization. The safer target is versioned migrations with:

- Reviewed forward and rollback plans.
- Backup/restore evidence.
- Staging execution against representative data.
- Verification of indexes and query plans.
- Deployment sequencing for API and workers.

This is an architectural change and warrants an ADR before implementation.

### 4.3 End-to-End Publication Validation

Maintain a representative set of sites and validate the real path:

1. Ingest or confirm inventory record.
2. Enqueue and consume a scan.
3. Observe page-group statuses and persisted fields.
4. Query the API.
5. Generate CSV and JSON snapshots against S3-compatible storage.
6. Compare keys/types against the contract manifest and dictionary.

Mocks remain useful for unit tests but cannot prove browser, queue, database,
serialization, and storage wiring.

### 4.4 Detector Quality Control

For each heuristic detector, keep a small labeled corpus with positive,
negative, ambiguous, and regression examples. Record method changes and sample
precision/coverage. Never convert a detection directly into a compliance claim
without domain-owner acceptance criteria.

## 5. Maintenance Model

### Corrective Maintenance

Examples: a broken API filter, incorrect status classification, bad field
mapping, or snapshot failure.

- Reproduce with the smallest realistic case.
- Name the failure mechanism, not only the symptom.
- Trace scan, mapping, entity, serializer, and consumer impact.
- Add a regression test that would have caught the defect.
- Verify the live end-to-end path when behavior affects publication.

### Adaptive Maintenance

Examples: Chrome/Puppeteer behavior, Node or Nest upgrades, Cloud Foundry
service changes, source CSV schema changes, policy changes, or API gateway
changes.

- Track upstream end-of-life and deprecation dates.
- Test against representative sites and production-shaped services.
- Update ATO/system-boundary evidence when infrastructure or data flows change.
- Communicate consumer contract impacts before deployment.

### Perfective Maintenance

Examples: a new scan, filter, report, snapshot, or performance improvement.

- Require product discovery and acceptance evidence from
  [Product management](PRODUCT_MANAGEMENT.md).
- Perform capacity and schema impact analysis.
- Keep enhancements separate from unrelated cleanup.
- Define operating and support cost before commitment.

### Preventive Maintenance

Examples: migrations, contract tests, index review, runbooks, removal of dead
code, dependency modernization, and architecture documentation.

- Prioritize by reduced risk/toil, not aesthetic preference.
- Track preventive work as explicit backlog items.
- Measure whether it lowers incident rate, change lead time, or support cost.

## 6. Change Impact Map

| Proposed change                 | Direct components                                 | Indirect consumers and regression scope                  | Typical risk   |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------- | -------------- |
| Add or rename public field      | Scan/type, result mapping, entity, snapshot order | API DTO, dictionary, CSV/JSON, analysis repos, user code | High           |
| Change detector logic           | Scan implementation and fixtures                  | Historical comparability, reports, outreach lists        | Medium to High |
| Add page group                  | Core scanner dispatcher, result types/mapping     | Runtime/capacity, DB schema, statuses, docs              | High           |
| Change queue policy             | Queue producer and consumer                       | Freshness, failure persistence, operational procedures   | High           |
| Change entity/schema            | Entities and database config/migration            | API, workers, snapshots, rollback/ATO evidence           | High           |
| Change source-list schema       | Ingest parser/interfaces                          | Inventory counts, ownership, downstream denominators     | High           |
| Change snapshot selection       | Website queries and snapshot tests                | Public file counts, trend comparability, reports         | High           |
| Change browser/Puppeteer        | Browser library and page scans                    | Every live detector and worker capacity                  | High           |
| Change worker count/concurrency | Deployment vars and Bull consumer                 | Website load, queue, DB, memory, cloud cost              | Medium to High |
| Change API filter/route         | DTO, controller, query                            | Gateway/docs/client integrations                         | Medium         |

## 7. Maintenance Cadence

| Frequency                   | Activity                                                                                           | Evidence                          |
| --------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| Daily                       | Confirm scheduled stage completion, queue age, worker health, snapshot existence, source freshness | Dashboard or run log              |
| Weekly                      | Review failures, retries, stale scans, dependency alerts, support incidents                        | Operating review notes            |
| Monthly                     | Analyze detector anomalies, API/contract drift, query performance, storage growth, toil            | Data quality report               |
| Quarterly                   | Validate a real end-to-end flow, review docs/diagrams/runbooks, restore test, stakeholder use      | Verification transcript           |
| Release                     | Build, lint, unit/integration tests, security scans, contract tests, smoke test, rollback review   | CI and release record             |
| Annually or material change | Architecture, threat, capacity, dependency, continuity, and ATO review                             | Updated system/security artifacts |

## 8. Operational Signals And Suggested Thresholds

Thresholds must be baselined before they become commitments. Initial trigger
examples:

- Oldest waiting job exceeds the expected scan-cycle completion window.
- More than 5% of sites are older than the stated freshness target.
- Any scheduled ingest or snapshot stage misses two consecutive runs.
- Unknown-error rate doubles relative to the trailing four-week baseline.
- A detector's sampled false-positive rate exceeds its accepted threshold.
- API p95 latency or database query time doubles against baseline.
- Worker memory repeatedly approaches its Cloud Foundry limit.
- Source schema/header or snapshot header changes unexpectedly.
- A high/critical dependency advisory has no disposition within the required
  response window.

## 9. Recovery Priorities

1. Preserve evidence and determine whether public data is incorrect, stale, or
   unavailable.
2. Stop publication when data integrity cannot be established; do not publish
   optimistic partial results without labeling them.
3. Restore inventory ingest and current scanning before optional analyses.
4. Restore snapshot publication and API consistency.
5. Reprocess affected sites or republish corrected artifacts when safe.
6. Notify consumers of material data errors, affected dates/fields, and the
   correction method.
7. Add a regression control and update the runbook after recovery.

## 10. Documentation Maintenance

The following documents currently overlap and need explicit ownership:

- This product guide.
- Root `README.md` and `docs/layout.md`.
- Existing Python-generated architecture diagram.
- Public `site-scanning-documentation` repository.
- Runtime Swagger/OpenAPI output.
- Data dictionary.
- GitHub workflow schedules and public schedule page.

For each artifact, name an authoritative scope. Code/configuration should be
authoritative for current execution, the field manifest should be authoritative
for the data contract, and public documentation should explain meaning and use.
Automate comparisons where possible.

## 11. Deferred Findings

The following observed work is documented but not filed as issues by agreement
for this documentation effort:

- Decide on migrations versus continued automatic schema synchronization.
- Correct the API `scan_status` filter.
- Align Swagger DTO names with serialized public names.
- Add contract tests across entities, snapshots, API, and the data dictionary.
- Restore a supported local snapshot-storage test path.
- Measure query performance before adding indexes.
- Confirm whether to wire or remove `client-redirect.ts`.
- Reconcile stale layout, architecture, and schedule documentation.
- Define first-class historical analysis and site identity.

These items should enter the program's normal tracking system before work is
scheduled. This document is analysis, not a substitute for an owned backlog.
