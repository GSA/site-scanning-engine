---
title: Site Scanning Data Use, Outreach, and Growth Ideas
description: Established use cases, outreach offers, and stakeholder-driven capability growth hypotheses.
status: draft
tier: 2
last_updated: 2026-10-09
---

# Data Use, Outreach, And Growth Ideas

## 1. Product Opportunity

Site Scanning's differentiator is not any single check. It combines a broad
federal website inventory, organizational ownership, browser observations,
network checks, common-government-service detections, and repeat publication.
That combination supports portfolio decisions that a single agency's crawler
or commercial site-quality tool usually cannot answer.

Growth should therefore focus on decisions and recurring workflows, not simply
on adding more columns. A new field has product value when a named user will
use it repeatedly to choose outreach, remediation, investment, migration, or
policy action.

## 2. Established Uses

These uses are documented by the program and should be treated as the baseline
value proposition.

| User                                     | Decision or workflow                                                           | Relevant data                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| OMB OFCIO and Digital Experience Council | Track federal web inventory, IDEA implementation, and rationalization          | Ownership, inventory, DAP, USWDS, redirects, live status           |
| Digital Analytics Program                | Find missing, outdated, or misconfigured installations and track code adoption | `dap`, parameters, version, GA tags, traffic                       |
| USWDS team                               | Estimate adoption and implementation depth                                     | USWDS component signals, version, score, agency                    |
| Search.gov                               | Understand market and site readiness                                           | Search detection, sitemap, robots, CMS, traffic                    |
| Touchpoints                              | Populate website status cards                                                  | Broad current website observations                                 |
| CISA                                     | Identify potentially unsafe third-party dependencies                           | Third-party domains and URLs, cookies, HTTPS/HSTS                  |
| NASA and other agency portfolio owners   | Inventory, consolidate, and rationalize websites                               | Initial/final identity, redirects, ownership, traffic, live status |
| NOAA                                     | Support internal website inventory tooling                                     | Inventory and technical metadata                                   |
| IPv6 migration teams                     | Prioritize adoption work                                                       | `ipv6`, agency, bureau, live status                                |
| NIST and standards programs              | Measure required-link and standards adoption                                   | Required links, language, main element, security fields            |

## 3. Practical Analyses Available Now

### Portfolio Inventory And Rationalization

- Count initial domains by agency and bureau.
- Identify multiple initial domains that redirect to the same final destination.
- Find dead, filtered, non-HTML, or repeatedly failing inventory entries.
- Combine redirects, low traffic, duplicate final destinations, page hashes,
  and sitemap size as evidence for consolidation research.
- Identify ownership gaps and records with missing bureau assignments.

**Important:** this data can prioritize human review; it does not by itself
authorize retirement or prove two sites have the same mission.

### Adoption And Targeted Outreach

- Produce agency adoption rates for DAP, USWDS, Search.gov, IPv6, HTTPS/HSTS,
  language metadata, and mobile viewport configuration.
- Build a prioritized contact list using agency, bureau, traffic, and detected
  implementation gaps.
- Separate "not detected" from "scan failed" before contacting site owners.
- Track cohort change using archived snapshots rather than the latest database
  row.

### Security And Privacy Discovery

- Inventory third-party domains, scripts, and cookie-setting domains by agency.
- Detect newly introduced third parties by comparing dated snapshots.
- Find common dependencies that create concentration or supply-chain risk.
- Combine login detection, third-party calls, and HTTPS/HSTS source data to
  prioritize review.

Scanner output should trigger investigation, not public vulnerability claims.
The current system does not perform penetration testing.

### Accessibility And User Experience

- Identify high-traffic sites with completed scans and recurring automated
  accessibility violation categories.
- Find missing language and `<main>` metadata, mobile viewport configuration,
  or unstable layout.
- Compare LCP and CLS by CMS or hosting signal to form modernization
  hypotheses.
- Offer agency-level remediation cohorts instead of one-site-at-a-time reports.

### Search And Content Operations

- Identify sites lacking detectable search, robots files, sitemaps, canonical
  links, or basic social/search metadata.
- Find sitemap indexes, unusually large sitemap/PDF footprints, and stale
  sitemap dates for follow-up.
- Use hyperlink domains to discover ecosystem connections and candidate missing
  inventory entries.

## 4. Outreach Offers

Outreach is more effective when the offer is a completed workflow rather than
"access to a dataset."

| Offer                             | Audience                                  | Deliverable                                                              | Conversion signal                                      |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Agency website portfolio briefing | Agency CIO, digital council, web lead     | Inventory, duplicates, failures, adoption summary                        | Agency validates inventory and assigns follow-up owner |
| Shared-service adoption campaign  | DAP, USWDS, Search.gov, Touchpoints       | Prioritized non-adopter list with confidence/status filters              | Outreach initiated and adoption change measured        |
| Third-party exposure review       | CISA, privacy, agency security            | Domain/service inventory and change report                               | Findings accepted into review workflow                 |
| Rationalization discovery sprint  | Agency portfolio office                   | Redirect clusters, low-traffic candidates, ownership gaps                | Human review decisions recorded                        |
| Data office onboarding            | Analysts and researchers                  | Sample notebook/query, dictionary walkthrough, reproducibility checklist | Repeat API/snapshot use                                |
| Scan co-design workshop           | Program owner with a specific policy need | Hypothesis, sample, false-positive review, acceptance criteria           | Named sponsor accepts prototype                        |

### Low-cost Outreach Assets

1. Publish one-page agency scorecards that always link to definitions and scan
   statuses.
2. Provide copyable recipes for common questions, not just endpoint syntax.
3. Hold quarterly office hours focused on one decision area such as inventory,
   analytics adoption, or third-party services.
4. Publish short case studies with a stakeholder, action taken, and measurable
   outcome.
5. Add a feedback link and a use-case identifier to downloads or report pages
   so usage can be associated with purpose without collecting sensitive data.
6. Offer agency-specific files and stable URLs to reduce each consumer's data
   preparation burden.

## 5. Capability Growth Portfolio

The public candidate-scans list contains many ideas. The following portfolio
organizes the strongest opportunities by user decision and prerequisite. These
are hypotheses, not approved commitments.

| Opportunity                                  | Likely user and decision                                               | Minimal evidence                                          | Key dependency or risk                                 |
| -------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Content Security Policy and security headers | CISA/security teams prioritize configuration review                    | Header presence and normalized policy summary             | Avoid implying full security posture                   |
| `security.txt` and vulnerability disclosure  | Agency security and policy teams identify missing contact paths        | Standards-compliant file detection                        | Redirects and malformed files                          |
| Certificate and DNS change monitoring        | Security teams investigate unexpected infrastructure changes           | Historical certificate/DNS observations                   | Requires first-class history and alerting              |
| JavaScript/library inventory and age         | Security/modernization teams find concentration and obsolete libraries | High-confidence library/version detection                 | False positives, version concealment                   |
| Touchpoints/form/PRA detection               | Feedback and policy programs target adoption/compliance                | Form and script detections with samples                   | Legal/policy interpretation must remain human          |
| `data.json` quality                          | Data.gov targets metadata remediation                                  | Presence, parse validity, basic quality measures          | Potentially large files and separate domain expertise  |
| Social account discovery                     | U.S. Digital Registry finds candidate official accounts                | Social links plus agency association                      | Verification of official ownership                     |
| Multilingual service signals                 | LEP and agency teams target language access work                       | Language links, declared language, common language routes | Homepage-only observation is incomplete                |
| Plain-language/readability indicators        | Content teams prioritize review                                        | Transparent text metrics on a defined page scope          | Scores can oversimplify audience needs                 |
| Real-user performance enrichment             | Digital experience teams target high-impact performance work           | CrUX or approved external field data                      | Coverage, licensing, source freshness                  |
| Structured data and schema.org               | Search/content teams improve discoverability                           | Parsed types and validation errors                        | Evolving standards and rich result differences         |
| AI/agent readiness                           | Emerging digital policy teams establish a baseline                     | Presence/quality of selected public artifacts             | Requirements are not mature; high hype risk            |
| Homepage meaningful-change alerts            | Agency owners detect defacement or unexpected change                   | Stable normalized content fingerprint and baseline        | Dynamic content creates noise; alert operations needed |
| Broken-link sampling                         | Agency content teams prioritize maintenance                            | Bounded sample and status classification                  | Crawl load and scope expansion                         |
| Sitemap-recursive site inventory             | Search and rationalization teams estimate content footprint            | Follow child sitemaps with limits                         | Load, loops, and large-site cost                       |

## 6. Recommended Product Increments

### Increment 1: Make Existing Data Easier To Trust And Use

- Align OpenAPI names with the current serialized contract.
- Add contract tests against the data dictionary and snapshot column order.
- Fix and test API filters, especially `scan_status`.
- Publish ready-to-run examples for agency inventory, DAP adoption, and
  third-party review.
- Define usage and outcome metrics beyond download counts.

This is the highest-leverage increment because it improves every use case
without increasing scanner cost or field count.

### Increment 2: Add Historical Comparison As A Product Capability

- Provide queryable or analysis-ready historical snapshots.
- Define stable site identity and deduplication rules.
- Publish change events for selected fields with confidence thresholds.
- Support cohort trend reporting by agency and program.

This unlocks adoption trends, regression detection, infrastructure change
monitoring, and outcome measurement. It requires a deliberate architecture
decision because the operational database currently stores only the latest row.

### Increment 3: Build A Stakeholder Campaign Toolkit

- Generate agency slices and confidence-filtered remediation lists.
- Add report templates with definitions, caveats, and contact paths.
- Track whether outreach leads to validation, remediation, or adoption.
- Establish an intake and acceptance process for partner-requested scans.

### Increment 4: Add One Co-designed Scan At A Time

Select a named partner, test a sample, establish precision/recall expectations,
and agree on the action the partner will take. Good first candidates are
`security.txt`, CSP/header presence, or structured-data detection because they
have bounded page scope and identifiable consumers. Avoid broad AI-content or
vulnerability detection until requirements and response processes are mature.

## 7. Experiment Template

Use this template before committing to a new scan or report.

| Question           | Required answer                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| User               | Named team and operational owner                                        |
| Decision           | What recurring decision changes because of this data?                   |
| Current workaround | How is the decision made today and at what cost?                        |
| Observation        | Exact public artifact or behavior to inspect                            |
| Scope              | Homepage, known path, sitemap, or bounded crawl                         |
| Acceptance         | Precision, coverage, freshness, and latency targets                     |
| Action             | What will the user do when the signal is positive or negative?          |
| Risk               | False-positive harm, load, security, privacy, and policy interpretation |
| Sustainability     | Test fixture, owner, documentation, and review cadence                  |
| Exit               | Condition for stopping if the hypothesis does not produce use           |

## 8. Growth Principles

- Prefer repeat users with a recurring decision over broad hypothetical demand.
- Improve trust, lineage, and usability before maximizing field count.
- Preserve failures and denominators; success-only data produces misleading
  rates.
- Keep observations separate from compliance judgments.
- Design outreach and measurement with stakeholders, not after engineering.
- Require an owner and maintenance plan for every new detector.
- Make history and stable identity explicit before promising monitoring.
