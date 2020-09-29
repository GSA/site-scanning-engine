/**
 * ResultCoreDto
 * 
 * Scan date/time (when data is written)

Target URL

Base Domain of Target URL

Final URL

Base Domain of Final URL

Whether Final URL is live

Whether the Target URL Redirects

Whether the Final URL has the same base domain as the Target URL

Whether the Final URL has the same base website as the Target URL

Agency Owner of Target URL Base Domain

Office Owner of Target URL Base Domain

Branch (of government)

Server Status Code of the Target URL

Server Status Code of the Final URL

Redirect Path

Server Codes at Each Step of the Redirect Path

Agency Website/Bureau Website?

Staging/etc?

Bureau Code

Agency Code

Uses Search.gov/Data.gov/Code.gov/Login.gov/DAP/USWDS/api.data.gov/feedback analytics/(anything else?)

Is Target URL/redirecttest-foo-bar-baz live?

File size of the final URL

SEO components of final URL - og date, unique title, Main element

Whether DAP is detected at the final URL

What DAP parameters are detected at the final URL
 */

export interface ResultCoreDto {
  targetUrl: string;
  agency: string;
  branch: string;
  finalUrl: string;
}
