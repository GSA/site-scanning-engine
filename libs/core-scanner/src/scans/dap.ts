import { Logger } from 'pino';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';

export type DapScriptCandidate = {
  url: string,
  parameters: string,
  body: string,
  postData?: string | null;
  version?: string | null;
}

const DAP_SCRIPT_NAME = 'Universal-Federated-Analytics-Min.js';
const DAP_GA_PROPERTY_IDS = ['G-CSLL4ZEK4L'];

export const buildDapResult = async (
  logger: Logger,
  outboundRequests: HTTPRequest[],
): Promise<DapScan> => {

  const dapScriptCandidateRequests: HTTPRequest[] = getDapScriptCandidateRequests(outboundRequests);

  if(dapScriptCandidateRequests === null) {
    return {
      dapDetected: false,
      dapParameters: "",
      dapVersion: ""
    };
  }

  const dapScriptCandidates: DapScriptCandidate[] = await getDapScriptCandidates(dapScriptCandidateRequests);

  const dapScript: DapScriptCandidate | null = getBestCandidate(dapScriptCandidates);

  if(dapScript === null) {
    return {
      dapDetected: false,
      dapParameters: "",
      dapVersion: ""
    };
  }

  return {
    dapDetected: true,
    dapParameters: dapScript.parameters,
    dapVersion: dapScript.version
  };  

};

/**
 * Consolidates a list of HTTPRequests to only include requests that contain DAP
 * related tags or scripts.
 * 
 * @param outboundRequests An object containing all HTTPRequests made from the page
 * @returns A pruned down lust of HTTPRequests that contain DAP related tags or scripts
 */
export function getDapScriptCandidateRequests(outboundRequests: HTTPRequest[]): HTTPRequest[] | null {
  let returnCandidates: HTTPRequest[] = [];

  for (const request of outboundRequests) {
    const requestUrl = request.url();
    const postData = request.postData();
 
    const isExactScriptMatch = checkUrlForScriptNameMatch(requestUrl);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(requestUrl);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(postData);
    const hasResponse = checkHasResponse(request);

    if( isExactScriptMatch || isPropertyIdMatch || isPostDataMatch && hasResponse ) {
      returnCandidates.push(request);
    }
  }

  return returnCandidates.length !== 0 ? returnCandidates : null;
}

/**
 * Check to see if we can get a response from the HTTPRequest
 * 
 * @param request The HTTPRequest we are checking a response for
 * @returns TRUE if the HTTPRequest has a resonse
 */
export function checkHasResponse(request: HTTPRequest): boolean {
  return request.response() === undefined ? false: true;
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
 * Checks a provided URL to see if it contains one or more of the DAP GA Propery IDs.
 * 
 * @param url The URL to check
 * @returns TRUE if the url contains our DAP PROPERY IDs
 */
export function checkUrlForPropertyIdMatch(url: string): boolean {
  return DAP_GA_PROPERTY_IDS.some((id) => url.includes(id));
}

/**
 * Checks postData for any of the DAP GA propery IDs.
 * 
 * @param postData The post body of the request
 * @returns TRUE if any of the DAP GA Property IDs are found in the postData
 */
export function checkPostDataForPropertyIdMatch(postData: string): boolean {
  try {
    return DAP_GA_PROPERTY_IDS.some((id) => postData.includes(id));
  } catch (error) {
    return false;
  }
}

/**
 * Takes our consolidated list of requests and organizes them into a type that contains
 * the fields we will need to further analyze the candidates.
 * 
 * @param dapScriptCandidateRequests A consolidated list of HTTPRequests that contain DAP
 * related tags or scripts
 * @returns A list of DAP candidates that we can further analyze to choose the best option.
 */
export async function getDapScriptCandidates(dapScriptCandidateRequests: HTTPRequest[]): Promise<DapScriptCandidate[]> {
  let returnCandidates: DapScriptCandidate[] = [];

  for (const request of dapScriptCandidateRequests) {
    let returnCandidate: DapScriptCandidate = {
      url: '',
      parameters: '',
      body: '',
    };
    const requestUrl = request.url();
    const response = request.response();
    const parsedUrl = new URL(requestUrl);
    returnCandidate.url = requestUrl;
    returnCandidate.parameters = parsedUrl.searchParams.toString() || '';
    try {
      returnCandidate.body = await response.text();
    } catch (error) {
      returnCandidate.body = '';
    }
    returnCandidate.version = returnCandidate.body !== null ? getDapVersion(returnCandidate.body) : '';
    returnCandidate.postData = request.postData();

    returnCandidates.push(returnCandidate);
    
  }

  return returnCandidates;
}

/**
 * This will return the best candidate for providing proper DAP analysis
 * 
 * @param dapScriptCandidates A list of DapScriptCandidates that will be analyzed to determine best option
 * @returns The best DAP candidate based on a series of checks
 */
export function getBestCandidate(dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate {

  for( const candidate of dapScriptCandidates ) {
    const requestUrl = candidate.url;
    const postData = candidate.postData;
    const dapVersion = candidate.version;

    const isExactScriptMatch = checkUrlForScriptNameMatch(requestUrl);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(requestUrl);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(postData);

    // 1. Exact name match AND version is detected
    if( isExactScriptMatch && dapVersion !== null) {
      return candidate
    }

    // 2. Property ID match (in url OR post body) AND version detected
    if( (isPropertyIdMatch || isPostDataMatch) && dapVersion !== null ) {
      return candidate
    }

    // 3. Anything with version detected
    if( dapVersion !== null ) {
      return candidate
    }

    // 4. Exact name match without version
    if( isExactScriptMatch ) {
      return candidate;
    }

    // 5. Any match
    if( isPropertyIdMatch || isPostDataMatch || isExactScriptMatch || dapVersion !== null ) {
      return candidate
    }
  }

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