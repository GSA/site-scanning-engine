#!/usr/bin/env ts-node

/**
 * Standalone script to export snapshot CSV directly from PostgreSQL database.
 * Includes the uswds_usa_elements_list field which is excluded from the public API/snapshot.
 *
 * Usage:
 *   npx ts-node scripts/export-snapshot.ts [--output path/to/file.csv]
 *
 * Environment variables:
 *   DATABASE_HOST (default: localhost)
 *   DATABASE_PORT (default: 5432)
 *   POSTGRES_USER (required)
 *   POSTGRES_PASSWORD (required)
 *   DATABASE_NAME (default: postgres)
 *   DATABASE_SSL (default: true)
 */

import { Client } from 'pg';
import { format } from '@fast-csv/format';
import * as fs from 'fs';
import * as process from 'process';
import { CoreResult } from '../entities/core-result.entity';
import { truncateArray } from '../libs/snapshot/src/serializers/csv-helpers';

const CHARACTER_LIMIT = 2000;

// Derive column order from the canonical CoreResult.snapshotColumnOrder with
// uswds_usa_elements_list added after uswds_usa_classes (this field is @Exclude()-ed
// from the public API/snapshot, which is why this script exists).
const base = CoreResult.snapshotColumnOrder;
const insertAt = base.indexOf('uswds_usa_classes');
const CSV_COLUMNS = [
  ...base.slice(0, insertAt + 1),
  'uswds_usa_elements_list',
  ...base.slice(insertAt + 1),
];

// Fields stored as comma-separated strings that should be split and JSON-stringified
const ARRAY_FIELDS = new Set([
  'source_list',
  'uswds_usa_class_list',
  'uswds_usa_elements_list',
  'third_party_service_domains',
  'third_party_service_urls',
  'cookie_domains',
  'login',
  'required_links_url',
  'required_links_text',
  'feedback_links_text',
  'robots_txt_sitemap_locations',
  'tooling',
  'hyperlink_domains',
]);

const DATE_FIELDS = new Set([
  'scan_date',
  'og_article_published',
  'og_article_modified',
]);

/**
 * Formats a row to match the official snapshot serializer behavior.
 */
function formatRow(row: Record<string, any>): Record<string, any> {
  const formatted: Record<string, any> = {};

  for (const key of CSV_COLUMNS) {
    let value = row[key];

    if (value === null || value === undefined) {
      formatted[key] = null;
      continue;
    }

    // Special handling for dap_parameters: parse as URLSearchParams and convert to object
    if (key === 'dap_parameters' && typeof value === 'string') {
      const params = new URLSearchParams(value);
      const obj: Record<string, string> = {};
      for (const [k, v] of params.entries()) {
        obj[k] = v;
      }
      formatted[key] = JSON.stringify(obj);
      continue;
    }

    // Date fields: convert to ISO string
    if (DATE_FIELDS.has(key) && value instanceof Date) {
      formatted[key] = value.toISOString();
      continue;
    }

    // Array fields: split, truncate, and JSON-stringify
    if (ARRAY_FIELDS.has(key) && typeof value === 'string') {
      if (value === '') {
        formatted[key] = '';
        continue;
      }
      const arr = value.split(',');
      const truncated = truncateArray(arr, CHARACTER_LIMIT);
      formatted[key] = JSON.stringify(truncated);
      continue;
    }

    // String fields: strip newlines and truncate
    if (typeof value === 'string') {
      let str = value.replace(/\r?\n|\r/g, '');
      if (str.length > CHARACTER_LIMIT) {
        str = str.substring(0, CHARACTER_LIMIT);
      }
      formatted[key] = str;
      continue;
    }

    // Boolean, number, etc.: pass through
    formatted[key] = value;
  }

  return formatted;
}

/**
 * Builds the SQL query with explicit column aliasing.
 */
function buildQuery(): string {
  return `
SELECT
  cr."finalSiteName" AS "name",
  cr."initialUrl" AS "initial_url",
  w.url AS "initial_domain",
  cr."targetUrlBaseDomain" AS "initial_base_domain",
  w."topLevelDomain" AS "initial_top_level_domain",
  cr."targetUrlRedirects" AS "redirect",
  cr."finalUrl" AS "url",
  cr."finalUrlWebsite" AS "domain",
  cr."finalUrlBaseDomain" AS "base_domain",
  cr."finalUrlTopLevelDomain" AS "top_level_domain",
  cr."finalUrlIsLive" AS "live",
  cr.filter AS "filter",
  cr."finalUrlStatusCode" AS "status_code",
  cr."finalUrlMIMEType" AS "media_type",
  w.agency AS "agency",
  w.bureau AS "bureau",
  w.branch AS "branch",
  cr."targetUrl404Test" AS "404_test",
  w."sourceList" AS "source_list",
  cr.updated AS "scan_date",
  cr."primaryScanStatus" AS "primary_scan_status",
  cr."accessibilityScanStatus" AS "accessibility_scan_status",
  cr."dnsScanStatus" AS "dns_scan_status",
  cr."notFoundScanStatus" AS "not_found_scan_status",
  cr."performanceScanStatus" AS "performance_scan_status",
  cr."robotsTxtScanStatus" AS "robots_txt_scan_status",
  cr."securityScanStatus" AS "security_scan_status",
  cr."sitemapXmlScanStatus" AS "sitemap_xml_scan_status",
  cr."wwwScanStatus" AS "www_scan_status",
  cr."finalUrlPageHash" AS "page_hash",
  cr."accessibilityResults" AS "accessibility_violations",
  cr.pageviews AS "pageviews",
  cr.visits AS "visits",
  cr."dnsIpv6" AS "ipv6",
  cr."dnsHostname" AS "hostname",
  cr.cms AS "cms",
  cr."loginProvider" AS "login_provider",
  cr."loginDetected" AS "login",
  cr."searchDetected" AS "site_search",
  cr.searchgov AS "search_dot_gov",
  cr."dapDetected" AS "dap",
  cr."dapParameters" AS "dap_parameters",
  cr."dapVersion" AS "dap_version",
  cr."gaTagIds" AS "ga_tag_id",
  cr."thirdPartyServiceDomains" AS "third_party_service_domains",
  cr."thirdPartyServiceUrls" AS "third_party_service_urls",
  cr."thirdPartyServiceCount" AS "third_party_service_count",
  cr."cookieDomains" AS "cookie_domains",
  cr."hyperlinkDomains" AS "hyperlink_domains",
  cr.tooling AS "tooling",
  cr."viewportMetaTag" AS "viewport_meta_tag",
  cr."cumulativeLayoutShift" AS "cumulative_layout_shift",
  cr."largestContentfulPaint" AS "largest_contentful_paint",
  cr."requiredLinksUrl" AS "required_links_url",
  cr."requiredLinksText" AS "required_links_text",
  cr."feedbackLinksText" AS "feedback_links_text",
  cr."httpsEnforced" AS "https_enforced",
  cr.hsts AS "hsts",
  cr."pageTitle" AS "title",
  cr."metaDescriptionContent" AS "description",
  cr."metaKeywordsContent" AS "keywords",
  cr."ogTitleFinalUrl" AS "og_title",
  cr."ogDescriptionFinalUrl" AS "og_description",
  cr."ogArticlePublishedFinalUrl" AS "og_article_published",
  cr."ogArticleModifiedFinalUrl" AS "og_article_modified",
  cr."ogImageContent" AS "og_image",
  cr."ogTypeContent" AS "og_type",
  cr."ogUrlContent" AS "og_url",
  cr."canonicalLink" AS "canonical_link",
  cr."htmlLangContent" AS "language",
  cr."hrefLangContent" AS "language_link",
  cr."mainElementFinalUrl" AS "main_element_present",
  cr."robotsTxtDetected" AS "robots_txt_detected",
  cr."robotsTxtFinalUrl" AS "robots_txt_url",
  cr."robotsTxtStatusCode" AS "robots_txt_status_code",
  cr."robotsTxtFinalUrlMimeType" AS "robots_txt_media_type",
  cr."robotsTxtFinalUrlSize" AS "robots_txt_filesize",
  cr."robotsTxtCrawlDelay" AS "robots_txt_crawl_delay",
  cr."robotsTxtSitemapLocations" AS "robots_txt_sitemap_locations",
  cr."sitemapXmlDetected" AS "sitemap_xml_detected",
  cr."sitemapXmlFinalUrl" AS "sitemap_xml_url",
  cr."sitemapXmlStatusCode" AS "sitemap_xml_status_code",
  cr."sitemapXmlFinalUrlMimeType" AS "sitemap_xml_media_type",
  cr."sitemapXmlFinalUrlFilesize" AS "sitemap_xml_filesize",
  cr."sitemapXmlCount" AS "sitemap_xml_count",
  cr."sitemapXmlLastMod" AS "sitemap_xml_lastmod",
  cr."sitemapXmlPdfCount" AS "sitemap_xml_pdf_count",
  cr."sitemapXmlPageHash" AS "sitemap_xml_page_hash",
  cr."uswdsUsFlag" AS "uswds_favicon",
  cr."uswdsUsFlagInCss" AS "uswds_favicon_in_css",
  cr."uswdsPublicSansFont" AS "uswds_publicsans_font",
  cr."uswdsInlineCss" AS "uswds_inpage_css",
  cr."usaClassesUsed" AS "uswds_usa_class_list",
  cr."heresHowYouKnowBanner" AS "uswds_banner_heres_how",
  cr."usaClasses" AS "uswds_usa_classes",
  cr."usaElementsUsed" AS "uswds_usa_elements_list",
  cr."uswdsString" AS "uswds_string",
  cr."uswdsStringInCss" AS "uswds_string_in_css",
  cr."uswdsSemanticVersion" AS "uswds_semantic_version",
  cr."uswdsVersion" AS "uswds_version",
  cr."uswdsCount" AS "uswds_count",
  cr."wwwFinalUrl" AS "www_url",
  cr."wwwStatusCode" AS "www_status_code",
  cr."wwwTitle" AS "www_title"
FROM core_result cr
INNER JOIN website w ON cr."websiteId" = w.id
ORDER BY cr."targetUrlBaseDomain" ASC, w.url ASC
  `.trim();
}

/**
 * Parses command line arguments.
 */
function parseArgs(): { outputPath?: string } {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  return { outputPath };
}

async function main() {
  const { outputPath } = parseArgs();

  // Validate required env vars
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!user || !password) {
    console.error('Error: POSTGRES_USER and POSTGRES_PASSWORD environment variables are required.');
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_HOST=localhost DATABASE_PORT=5432 \\');
    console.error('  POSTGRES_USER=user POSTGRES_PASSWORD=pass \\');
    console.error('  DATABASE_NAME=postgres \\');
    console.error('  npx ts-node scripts/export-snapshot.ts [--output file.csv]');
    process.exit(1);
  }

  // Build connection config
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const database = process.env.DATABASE_NAME || 'postgres';
  const ssl = process.env.DATABASE_SSL !== 'false';

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: ssl ? { rejectUnauthorized: false } : false,
  });

  console.error(`Connecting to ${host}:${port}/${database}...`);

  try {
    await client.connect();
    console.error('Connected. Executing query...');

    const { rows } = await client.query(buildQuery());
    console.error(`Fetched ${rows.length} rows. Generating CSV...`);

    const outputStream = outputPath
      ? fs.createWriteStream(outputPath)
      : process.stdout;

    const csvStream = format({
      headers: CSV_COLUMNS,
      rowDelimiter: '\r\n',
    });

    csvStream.pipe(outputStream);

    for (const row of rows) {
      csvStream.write(formatRow(row));
    }

    csvStream.end();

    await new Promise((resolve) => csvStream.on('finish', resolve));

    if (outputPath) {
      console.error(`CSV written to ${outputPath}`);
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
