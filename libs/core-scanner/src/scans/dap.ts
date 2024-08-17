import { Logger } from 'pino';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';
import {empty} from "rxjs";

export type DapScriptCandidate = {
  url: string,
  parameters: string,
  body: string,
  postData?: string | null;
  version?: string;
}

const DAP_SCRIPT_NAME = 'Universal-Federated-Analytics-Min.js';
const DAP_GA_PROPERTY_IDS = ['G-CSLL4ZEK4L'];

export const buildDapResult = async (
  logger: Logger,
  outboundRequests: HTTPRequest[],
): Promise<DapScan> => {
  const emptyResponse = {
    dapDetected: false,
    dapParameters: "",
    dapVersion: ""
  };

  if(outboundRequests.length === 0) {
    return emptyResponse;
  }

  const dapScriptCandidateRequests: HTTPRequest[] = getDapScriptCandidateRequests(outboundRequests);

  if(dapScriptCandidateRequests.length === 0) {
    return emptyResponse;
  }

  const dapScriptCandidates: DapScriptCandidate[] = await getDapScriptCandidates(dapScriptCandidateRequests);

  const dapScript: DapScriptCandidate | null = getBestCandidate(dapScriptCandidates);

  if(dapScript === null) {
    return emptyResponse;
  }

  return {
    dapDetected: true,
    dapParameters: dapScript.parameters,
    dapVersion: dapScript.version
  };  

};

// --

/**
 * Filters a list of HTTPRequests to only include requests that contain DAP
 * related tags or scripts.
 * 
 * @param allRequests An object containing all HTTPRequests made from the page
 * @returns A pruned down lust of HTTPRequests that contain DAP related tags or scripts
 */
export function getDapScriptCandidateRequests(allRequests: HTTPRequest[]): HTTPRequest[] {
  const candidates: HTTPRequest[] = [];

  for (const request of allRequests) {
    if(!checkForResponse(request)) {
      continue;
    }

    const requestUrl = request.url();
    const postData = request.postData();
    const isExactScriptMatch = checkUrlForScriptNameMatch(requestUrl);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(requestUrl);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(postData);

    if( isExactScriptMatch || isPropertyIdMatch || isPostDataMatch ) {
      candidates.push(request);
    }
  }

  return candidates;
}

/**
 * Transforms an array of Puppeteer.HTTPRequest objects into our custom DapScriptCandidate object
 * in order to promote compute efficiency and promote testability of the other functions
 * in this process.
 *
 * @param dapScriptCandidateRequests An array of Puppeteer.HTTPRequest objects
 * @returns The requests passed in, but transformed into DapScriptCandidate objects.
 */
export async function getDapScriptCandidates(dapScriptCandidateRequests: HTTPRequest[]): Promise<DapScriptCandidate[]> {
  const candidates: DapScriptCandidate[] = [];

  for (const request of dapScriptCandidateRequests) {
    const url = request.url();
    const parsedUrl = new URL(url);

    const candidate: DapScriptCandidate = {
      body: await request.response()?.text() || "",
      parameters: parsedUrl.searchParams.toString() || '',
      postData: null,
      url: request.url(),
      version: ""
    };

    candidate.version = candidate.body !== null ? getDapVersion(candidate.body) : '';

    try {
      candidate.postData = request.postData();
    } catch {}

    candidates.push(candidate);
  }

  return candidates;
}

/**
 * This will return the best candidate for providing proper DAP analysis
 *
 * @param dapScriptCandidates A list of DapScriptCandidates that will be analyzed to determine best option
 * @returns The best DAP candidate based on a series of checks
 */
export function getBestCandidate(dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate {

  for( const candidate of dapScriptCandidates ) {
    const hasVersion = candidate.version !== "";

    const isExactScriptMatch = checkUrlForScriptNameMatch(candidate.url);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(candidate.url);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(candidate.postData);

    // 1. Exact name match AND version is detected
    if( isExactScriptMatch && hasVersion) {
      return candidate;
    }

    // 2. Property ID match (in url OR post body) AND version detected
    if( (isPropertyIdMatch || isPostDataMatch) && hasVersion) {
      return candidate;
    }

    // 3. Anything with version detected
    if( hasVersion ) {
      return candidate;
    }

    // 4. Exact name match without version
    if( isExactScriptMatch ) {
      return candidate;
    }

    // 5. Any match
    if( isPropertyIdMatch || isPostDataMatch || isExactScriptMatch || hasVersion ) {
      return candidate;
    }
  }

}

// --

/**
 * Check to see if we can get a response from the HTTPRequest
 * 
 * @param request The HTTPRequest we are checking a response for
 * @returns TRUE if the HTTPRequest has a response
 */
export function checkForResponse(request: HTTPRequest): boolean {
  return !!request.response();
}

/**
 * Checks a provided URL to see if the exact, known, script name is within it.
 *
 * @param url The URL to check
 * @returns TRUE if the the script name found; FALSE otherwise.
 */
export function checkUrlForScriptNameMatch(url: string): boolean {
  return url.includes(DAP_SCRIPT_NAME);
}

/**
 * Checks a provided URL to see if it contains one or more of the DAP GA Property IDs.
 * 
 * @param url The URL to check
 * @returns TRUE if the url contains at least one DAP property id; FALSE otherwise
 */
export function checkUrlForPropertyIdMatch(url: string): boolean {
  return DAP_GA_PROPERTY_IDS.some((id) => url.includes(id));
}

/**
 * Searches through the response body for the version number using RegEx
 * Specifically looking for VERSION:
 *
 * @param dapScriptText The text representation of the response body
 * @returns
 */
export function getDapVersion(dapScriptText: string): string {
  const versionRegex = /VERSION\s*:\s*['"]([^'"]+)['"]/;
  const match = dapScriptText.match(versionRegex);
  return match ? match[1] : '';
}

/**
 * Checks a POST data string to see if contains a DAP property ID.
 *
 * @param postData The post body of the request
 * @returns TRUE if the POST data contains at least one DAP property id; FALSE otherwise
 */
export function checkPostDataForPropertyIdMatch(postData: string): boolean {
  return DAP_GA_PROPERTY_IDS.some((id) => postData.includes(id));
}
