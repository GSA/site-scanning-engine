# Add Scan Skill

Guide for implementing a new scan in the core-scanner library.

## Architecture Overview

The core-scanner has two main concepts:

- **Pages** (`libs/core-scanner/src/pages/`): Different page types to scan (primary, robots.txt, sitemap.xml, DNS, accessibility, performance, www, notFound, clientRedirect)
- **Scans** (`libs/core-scanner/src/scans/`): Specific analyses performed on pages (DAP, CMS, cookies, USWDS, SEO, login, search, third-party services, tooling, required-links, feedback-links, mobile, url-scan)

The `primary` scanner acts as parent - specific scans are children (sitemaps, USWDS checks, etc.).

## Implementation Steps

### 1. Create Scan Function

Create a new file in `libs/core-scanner/src/scans/` with your scan logic:

```typescript
export async function myScan(page: Page | Response): Promise<MyScanResult> {
  // Your scan logic here
  // Evaluate the DOM to extract desired data
  return {
    // scan results
  };
}
```

**Parameters:**
- `page`: Puppeteer Page object for interactive scanning
- `response`: HTTP Response object for analyzing response data

**Return:** Object with scan results that will be merged into final result

### 2. Evaluate the DOM

Use Puppeteer's page evaluation to extract data. See `uswds.ts` as a good example:

```typescript
const result = await page.evaluate(() => {
  // This runs in browser context
  const elements = document.querySelectorAll('.my-selector');
  return Array.from(elements).map(el => el.textContent);
});
```

### 3. Integrate into Primary Scanner

Edit the primary scanner to call your new scan function and merge results:

```typescript
const myScanResults = await myScan(page);
Object.assign(finalResult, myScanResults);
```

### 4. Define Entity Properties

Add corresponding properties to `entities/core-result.entity.ts` with TypeORM decorators:

```typescript
@Column({ type: 'boolean', nullable: true })
myNewField: boolean;
```

### 5. Update Tests

Add unit tests in the scan library's spec file.

## Development Tips

- Start simple - test scan logic in isolation first
- Use `scan-site` CLI command for quick iteration
- Consider performance - scans run on thousands of sites
- Handle errors gracefully - sites may be unreliable
- Document what your scan detects and why it matters

## Example Scans to Reference

- `libs/core-scanner/src/scans/uswds.ts` - DOM evaluation example
- `libs/core-scanner/src/scans/dap.ts` - Script detection
- `libs/core-scanner/src/scans/cookies.ts` - Response header analysis

## Testing Your Scan

Test locally with a single site:

```bash
npx nest start cli -- scan-site --url yourtestsite.gov
```

Results will print to console with your new fields included.
