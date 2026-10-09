---
title: Site Scanning Data Guide
description: Consumer data lineage, publication paths, interpretation rules, and public field change requirements.
status: canonical
tier: 2
last_updated: 2026-10-09
---

# Site Scanning Data Guide

## 1. Purpose

This guide connects the consumer-facing
[Site Scanning Data Dictionary](https://github.com/GSA/site-scanning-documentation/blob/main/data/Site_Scanning_Data_Dictionary.csv)
to the implementation that creates and publishes each field. Use the data
dictionary for plain-language definitions and this guide for lineage, caveats,
and change impact.

The published record is not a single database row. It is a serialized merge of
the `Website` inventory record and its latest `CoreResult`. Public names come
from `@Expose` decorators, and bulk snapshot inclusion and order come from
`CoreResult.snapshotColumnOrder` in
[`entities/core-result.entity.ts`](../../entities/core-result.entity.ts).

## 2. Data Lifecycle

| Stage                         | Input                                               | Transformation                                                    | Durable output                 |
| ----------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| Website-index build, external | Many federal source lists                           | Normalize, filter, associate ownership                            | Federal Website Index CSV      |
| Ingest                        | Website Index CSV                                   | Lowercase target, combine source flags, upsert, remove stale rows | `website` table                |
| Queue                         | Website records                                     | Attach internal ID, traffic/filter metadata, scan ID              | Bull `core` jobs               |
| Scan                          | Target URL, browser/network observations, CISA data | Nine page groups and 13 primary checks                            | In-memory `CoreResultPages`    |
| Persistence                   | Page-group results                                  | Flatten, serialize lists as strings, set statuses                 | Latest `core_result` row       |
| Publication                   | Joined website and result                           | Public-name transform, field ordering, CSV formatting             | API responses and S3 snapshots |
| Downstream use, external      | Snapshots/API                                       | Analysis, agency slices, dashboards, reports                      | Consumer products              |

## 3. Public Field Lineage

The tables cover all fields currently listed in `snapshotColumnOrder`. Fields
marked API-only are public through serialization but intentionally omitted from
bulk snapshots. Internal or experimental columns decorated with `@Exclude()`
are not public.

### Identity, Inventory, Ownership, And Traffic

| Public fields                                                                             | Entity properties                                                           | Origin                                         | Implementation                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initial_domain`, `initial_top_level_domain`, `agency`, `bureau`, `branch`, `source_list` | `Website.url`, `topLevelDomain`, `agency`, `bureau`, `branch`, `sourceList` | Federal Website Index ingest                   | [`libs/ingest/src/ingest.service.ts`](../../libs/ingest/src/ingest.service.ts), [`entities/website.entity.ts`](../../entities/website.entity.ts)                                                |
| `initial_url`, `initial_base_domain`                                                      | `CoreResult.initialUrl`, `targetUrlBaseDomain`                              | Queue target and core scanner base result      | [`libs/core-scanner/src/core-scanner.service.ts`](../../libs/core-scanner/src/core-scanner.service.ts), [`core-result.service.ts`](../../libs/database/src/core-results/core-result.service.ts) |
| `pageviews`, `visits`                                                                     | `Website.pageviews`, `visits`; copied to `CoreResult` during scanning       | Federal Website Index/DAP source data          | Ingest and core-result persistence                                                                                                                                                              |
| `filter`                                                                                  | `Website.filter`; copied and possibly promoted in `CoreResult.filter`       | Index filter plus detected non-page media type | Ingest and `CoreResult.filteredMediaTypes`                                                                                                                                                      |
| `secondary_data_dates`                                                                    | `CoreResult.dapDataDate`, `httpsDataDate`                                   | Last update dates of secondary source files    | `@Transform` in `core-result.entity.ts`; CLI data-freshness task                                                                                                                                |

`name` is derived after the primary scan from the final website hostname with a
leading `www.` removed. It is useful for grouping, but redirects can still make
multiple input records describe the same destination.

### URL Outcome And Main Page

| Public fields                                                | Entity properties                                                                                    | Origin                  | Implementation                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `name`, `url`, `domain`, `base_domain`, `top_level_domain`   | `finalSiteName`, `finalUrl`, `finalUrlWebsite`, `finalUrlBaseDomain`, `finalUrlTopLevelDomain`       | URL scan                | [`libs/core-scanner/src/scans/url-scan.ts`](../../libs/core-scanner/src/scans/url-scan.ts)   |
| `redirect`, `live`, `status_code`, `media_type`, `page_hash` | `targetUrlRedirects`, `finalUrlIsLive`, `finalUrlStatusCode`, `finalUrlMIMEType`, `finalUrlPageHash` | URL scan                | `url-scan.ts`                                                                                |
| `404_test`                                                   | `targetUrl404Test`                                                                                   | Random nonexistent path | [`libs/core-scanner/src/pages/not-found.ts`](../../libs/core-scanner/src/pages/not-found.ts) |
| `viewport_meta_tag`                                          | `viewportMetaTag`                                                                                    | Mobile check            | [`libs/core-scanner/src/scans/mobile.ts`](../../libs/core-scanner/src/scans/mobile.ts)       |

`live` means that the final response status is in the successful 2xx family. It
does not establish content quality, public accessibility, or correct ownership.

### Scan Status And Freshness

| Public fields               | Entity properties         | Meaning                                                                                          |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `scan_date`                 | `CoreResult.updated`      | Last time the latest result row was written, not necessarily the observation time of every field |
| `primary_scan_status`       | `primaryScanStatus`       | Main browser page and primary checks                                                             |
| `accessibility_scan_status` | `accessibilityScanStatus` | axe-core page group                                                                              |
| `dns_scan_status`           | `dnsScanStatus`           | DNS page group                                                                                   |
| `not_found_scan_status`     | `notFoundScanStatus`      | Random-path page group                                                                           |
| `performance_scan_status`   | `performanceScanStatus`   | performance page group                                                                           |
| `robots_txt_scan_status`    | `robotsTxtScanStatus`     | robots page group                                                                                |
| `security_scan_status`      | `securityScanStatus`      | external security-data lookup                                                                    |
| `sitemap_xml_scan_status`   | `sitemapXmlScanStatus`    | sitemap page group                                                                               |
| `www_scan_status`           | `wwwScanStatus`           | `www.`-prefixed page group                                                                       |

Statuses are generated independently for each page group. A completed primary
scan does not imply that accessibility, performance, DNS, security, or resource
checks completed. Consult the relevant status before interpreting a blank
field. Status definitions are maintained in
[`entities/scan-status.ts`](../../entities/scan-status.ts) and explained in the
public
[scan status guide](https://github.com/GSA/site-scanning-documentation/blob/main/pages/scan_statuses.md).

### Accessibility And Performance

| Public fields                                         | Entity properties              | Origin                                   | Implementation                                                                                   |
| ----------------------------------------------------- | ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `accessibility_violations`                            | `accessibilityResults`         | Aggregated automated axe-core violations | [`libs/core-scanner/src/pages/accessibility`](../../libs/core-scanner/src/pages/accessibility)   |
| Accessibility detail list, separate JSON only         | `accessibilityResultsList`     | Full selected violation details          | `SnapshotService.accessibilityResultsSnapshot()`                                                 |
| `largest_contentful_paint`, `cumulative_layout_shift` | Same camel-case property names | Browser performance observers            | [`libs/core-scanner/src/pages/performance.ts`](../../libs/core-scanner/src/pages/performance.ts) |

Automated accessibility findings are partial evidence and never establish full
conformance. Performance observations are a single synthetic run from the scan
environment, not field data from real users.

### Infrastructure, Analytics, And Third Parties

| Public fields                                                                          | Entity properties                                        | Origin                                       | Implementation                                                                                         |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ipv6`, `hostname`                                                                     | `dnsIpv6`, `dnsHostname`                                 | DNS records and recognized provider suffixes | [`libs/core-scanner/src/pages/dns.ts`](../../libs/core-scanner/src/pages/dns.ts)                       |
| `cms`                                                                                  | `cms`                                                    | Page/header signature matching               | [`libs/core-scanner/src/scans/cms.ts`](../../libs/core-scanner/src/scans/cms.ts)                       |
| `login`, `login_provider`                                                              | `loginDetected`, `loginProvider`                         | Page signature matching                      | [`libs/core-scanner/src/scans/login.ts`](../../libs/core-scanner/src/scans/login.ts)                   |
| `site_search`, `search_dot_gov`                                                        | `searchDetected`, `searchgov`                            | Form and endpoint patterns                   | [`libs/core-scanner/src/scans/search.ts`](../../libs/core-scanner/src/scans/search.ts)                 |
| `dap`, `dap_parameters`, `dap_version`, `ga_tag_id`                                    | `dapDetected`, `dapParameters`, `dapVersion`, `gaTagIds` | Outbound request and DAP script inspection   | [`libs/core-scanner/src/scans/dap.ts`](../../libs/core-scanner/src/scans/dap.ts)                       |
| `third_party_service_domains`, `third_party_service_urls`, `third_party_service_count` | Corresponding camel-case properties                      | Outbound requests differing from page host   | [`libs/core-scanner/src/scans/third-party.ts`](../../libs/core-scanner/src/scans/third-party.ts)       |
| `cookie_domains`                                                                       | `cookieDomains`                                          | Browser cookies observed during load         | [`libs/core-scanner/src/scans/cookies.ts`](../../libs/core-scanner/src/scans/cookies.ts)               |
| `hyperlink_domains`                                                                    | `hyperlinkDomains`                                       | Distinct domains in page links               | [`libs/core-scanner/src/scans/required-links.ts`](../../libs/core-scanner/src/scans/required-links.ts) |
| `tooling`                                                                              | `tooling`                                                | Script, stylesheet, and generator signatures | [`libs/core-scanner/src/scans/tooling.ts`](../../libs/core-scanner/src/scans/tooling.ts)               |

These are detections, not verified inventories. Blank usually means "not
detected by the current method," not "definitively absent." Third-party and
cookie observations also depend on what loaded during this specific visit.

### Content, Discoverability, And Required Links

| Public fields                                                                                                | Entity properties                                                            | Origin                                       | Implementation                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `title`, `description`, `keywords`                                                                           | `pageTitle`, `metaDescriptionContent`, `metaKeywordsContent`                 | HTML metadata                                | [`libs/core-scanner/src/scans/seo.ts`](../../libs/core-scanner/src/scans/seo.ts)                       |
| `og_title`, `og_description`, `og_article_published`, `og_article_modified`, `og_image`, `og_type`, `og_url` | Corresponding Open Graph properties                                          | HTML metadata                                | `seo.ts`                                                                                               |
| `canonical_link`, `language`, `language_link`, `main_element_present`                                        | `canonicalLink`, `htmlLangContent`, `hrefLangContent`, `mainElementFinalUrl` | HTML metadata/elements                       | `seo.ts`                                                                                               |
| `required_links_url`, `required_links_text`                                                                  | Same camel-case properties                                                   | Pattern matches against link URLs and labels | `required-links.ts`                                                                                    |
| `feedback_links_text`                                                                                        | `feedbackLinksText`                                                          | Exact feedback-link label matches            | [`libs/core-scanner/src/scans/feedback-links.ts`](../../libs/core-scanner/src/scans/feedback-links.ts) |

The six Dublin Core and similar date properties in `CoreResult` are marked
experimental and excluded from public serialization and snapshots.

### Robots.txt And Sitemap.xml

| Public fields                                                                                                                                                                                                        | Entity properties                | Origin                                | Implementation                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `robots_txt_detected`, `robots_txt_url`, `robots_txt_status_code`, `robots_txt_media_type`, `robots_txt_filesize`, `robots_txt_crawl_delay`, `robots_txt_sitemap_locations`                                          | Corresponding robots properties  | Request to `/robots.txt`              | [`libs/core-scanner/src/pages/robots-txt.ts`](../../libs/core-scanner/src/pages/robots-txt.ts)   |
| `sitemap_xml_detected`, `sitemap_xml_url`, `sitemap_xml_status_code`, `sitemap_xml_media_type`, `sitemap_xml_filesize`, `sitemap_xml_count`, `sitemap_xml_lastmod`, `sitemap_xml_pdf_count`, `sitemap_xml_page_hash` | Corresponding sitemap properties | Request and parsing of `/sitemap.xml` | [`libs/core-scanner/src/pages/sitemap-xml.ts`](../../libs/core-scanner/src/pages/sitemap-xml.ts) |

`sitemap_xml_count` counts URL entries in the fetched file. A sitemap index can
legitimately contain zero direct URL entries while referring to child sitemaps.
The PDF count is text-based and should be treated as an estimate.

### Security

| Public fields            | Entity properties       | Origin                           | Implementation                                   |
| ------------------------ | ----------------------- | -------------------------------- | ------------------------------------------------ |
| `https_enforced`, `hsts` | `httpsEnforced`, `hsts` | External CISA-derived CSV lookup | [`libs/security-data`](../../libs/security-data) |

The security page group does not directly test the target website. A missing
match is a coverage limitation of the external source and must not be presented
as proof that a site is insecure.

### USWDS

| Public fields                                                                                   | Entity properties                                                          | Origin                                                |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| `uswds_favicon`, `uswds_favicon_in_css`, `uswds_publicsans_font`, `uswds_inpage_css`            | `uswdsUsFlag`, `uswdsUsFlagInCss`, `uswdsPublicSansFont`, `uswdsInlineCss` | HTML and stylesheet heuristics                        |
| `uswds_usa_class_list`, `uswds_usa_classes`                                                     | `usaClassesUsed`, `usaClasses`                                             | `usa-` class detection and score                      |
| `uswds_usa_elements_list`, `uswds_banner_heres_how`                                             | `usaElementsUsed`, `heresHowYouKnowBanner`                                 | Element and banner detection                          |
| `uswds_string`, `uswds_string_in_css`, `uswds_semantic_version`, `uswds_version`, `uswds_count` | Corresponding USWDS properties                                             | Source/CSS strings, version detection, combined score |

All fields originate in
[`libs/core-scanner/src/scans/uswds.ts`](../../libs/core-scanner/src/scans/uswds.ts).
`uswds_count` is a heuristic score, not a conformance grade or a count of
components.

### WWW Behavior

| Public fields                             | Entity properties                          | Publication                                                |
| ----------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `www_url`, `www_status_code`, `www_title` | `wwwFinalUrl`, `wwwStatusCode`, `wwwTitle` | API and snapshots                                          |
| `www_same`                                | `wwwSame`                                  | API serialization only; omitted from `snapshotColumnOrder` |

These fields originate in
[`libs/core-scanner/src/pages/www.ts`](../../libs/core-scanner/src/pages/www.ts).
Adding `www.` to an existing subdomain often creates a name that should not
exist, so DNS failures are expected for many records.

## 4. Publication Paths

### REST API

- `GET /websites` returns paginated latest results.
- `GET /websites/:url` looks up the exact initial domain without a scheme.
- `GET /analysis` returns filtered counts plus live queue counts.
- Requests require the configured `X-Secret-Api-Access-Token` header.
- Multiple supported filters are combined with AND semantics.

The current implementation supports filters for initial base domain, final base
domain, liveness, redirects, agency, bureau, DAP detection, and a nominal scan
status filter. The `scan_status` query currently references
`coreResult.status`, which is not an entity property, and should be considered
defective until corrected. The data dictionary correctly warns consumers about
this behavior.

The generated Swagger DTO at
[`apps/api/src/website/website-api-result.dto.ts`](../../apps/api/src/website/website-api-result.dto.ts)
contains legacy names such as `target_url` and `final_url`; it does not fully
match the current serialized public contract. Treat the entity expose names,
runtime OpenAPI output, snapshots, and data dictionary as separate artifacts
that require explicit contract testing.

### Bulk Snapshots

| Variant               | Inclusion rule                                      | Typical use                                    |
| --------------------- | --------------------------------------------------- | ---------------------------------------------- |
| All                   | Has a result record                                 | Diagnostics, completeness, failure analysis    |
| Live                  | Successful final URL and non-data media type        | Broad active-site analysis                     |
| Live filtered         | Live plus `filter = false`                          | Default human-facing website analysis          |
| Live filtered unique  | Live filtered plus no redirect                      | Reduced duplicate starting points              |
| Accessibility details | Live, completed accessibility scan, details present | Accessibility research and remediation support |

CSV and JSON use the same ordered field list. CSV list values are flattened and
long values can be truncated; JSON should be preferred when complete arrays are
required.

## 5. Interpretation Rules

1. Check the relevant `*_scan_status` before interpreting a blank.
2. Distinguish initial identity from final destination. Ownership describes the
   input inventory record; redirects can lead elsewhere.
3. Do not count rows as unique websites without choosing and documenting a
   deduplication rule.
4. Treat detections as evidence, not certification. Most scanner checks are
   signature or heuristic based.
5. Treat `scan_date` as row-write freshness. Use `secondary_data_dates` for
   secondary sources and archived snapshots for historical comparisons.
6. Use JSON for complete list-valued data and CSV for tabular exploration.
7. Use the all-results snapshot when analyzing scan reliability; restricting to
   live results creates survivorship bias.
8. Record the snapshot date, variant, field definitions, and query/filter logic
   with any published analysis.

## 6. Adding Or Changing A Public Field

A field change is complete only when all affected surfaces agree:

1. Add or modify the scan result type and scanner implementation.
2. Map it in `CoreResultService` for success, absence, and failure paths.
3. Add the database column and public `@Expose` name to `CoreResult` or
   `Website`.
4. Add it to `snapshotColumnOrder` if it belongs in bulk data.
5. Update API DTO/OpenAPI documentation and query support if applicable.
6. Update snapshot and serializer tests, including list/truncation behavior.
7. Update the public data dictionary and this lineage guide.
8. Verify a live scan, persisted row, API response, CSV snapshot, and JSON
   snapshot before announcing availability.

This is a cross-repository contract change. Coordinate releases with the
documentation and downstream analysis repositories rather than treating it as
an entity-only edit.
