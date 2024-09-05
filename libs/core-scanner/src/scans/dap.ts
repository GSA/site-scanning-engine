import { Logger } from 'pino';
import { uniq } from 'lodash';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';

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
    dapVersion: "",
    gaTagIds: "",
  };

  if(outboundRequests.length === 0) {
    logger.info({funcion: 'buildDapResult'}, 'No outbound requests found');
    return emptyResponse;
  }

  const allGAPropertyIds: string = getAllGAPropertyTags(logger, outboundRequests);

  const dapScriptCandidateRequests: HTTPRequest[] = getDapScriptCandidateRequests(logger, outboundRequests);

  if(dapScriptCandidateRequests.length === 0 && allGAPropertyIds === '') {
    logger.info({funcion: 'buildDapResult'}, 'No GA property Ids or DAP script candidates found');
    return emptyResponse;
  }
  
  if(dapScriptCandidateRequests.length === 0 && allGAPropertyIds != '') {
    logger.info({funcion: 'buildDapResult'}, 'GA property Ids have been found but no DAP script candidates found');
    return {
      dapDetected: false,
      dapParameters: "",
      dapVersion: "",
      gaTagIds: allGAPropertyIds,
    };
  }

  const dapScriptCandidates: DapScriptCandidate[] = await getDapScriptCandidates(logger, dapScriptCandidateRequests);

  const dapScript: DapScriptCandidate | null = getBestCandidate(logger, dapScriptCandidates);

  if(dapScript === null) {
    return emptyResponse;
  }

  return {
    dapDetected: true,
    dapParameters: dapScript.parameters,
    dapVersion: dapScript.version,
    gaTagIds: allGAPropertyIds,
  };  

};

/**
 * Returns a comma delimited string of all GA Property IDs found in the given requests
 * 
 * @param logger A logger object
 * @param allRequests An object containing all HTTPRequests made from the page
 * @returns A comma delimited string of all GA Property IDs found in the requests
 */
export function getAllGAPropertyTags(logger: Logger, allRequests: HTTPRequest[]): string {
  let allGAPropertyIds: string[] = [];

  for (const request of allRequests) {
    const requestUrl = request.url();
    const postData = request.postData();
    
    if ( !requestUrl ) {
      continue;
    }
    logger.info({funcion: 'getAllGAPropertyTags'}, 'Checking request for GA tags in requestUrl', { requestUrl });
    if( getG4Tag(requestUrl).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getG4Tag(requestUrl));
    }
    if( getUATag(requestUrl).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getUATag(requestUrl));
    }
    if ( !postData ) {
      continue;
    }
    logger.info({funcion: 'getAllGAPropertyTags'}, 'Checking request for GA tags in post data', { postData });
    if ( getG4Tag(postData).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getG4Tag(postData));
    }
    if ( getUATag(postData).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getUATag(postData));
    }
  }

  const uniqueGAPropertyIds = uniq(allGAPropertyIds);
  logger.info({funcion: 'getAllGAPropertyTags'}, 'Unique GA Property IDs found', { uniqueGAPropertyIds });
  return uniqueGAPropertyIds.join(',');
}

/**
 * 
 * @param stringToSearch The string that may contain a G4 tag
 * @returns Returns the G4 tag if found, otherwise an empty string
 */
export function getG4Tag(stringToSearch: string): string[] {
  const g4TagRegex = /G-[a-zA-Z\d]{4,15}/g;
  const match = stringToSearch.match(g4TagRegex);
  return match ? match : [];
}

/**
 * 
 * @param requestUrl The string that may contain a UA tag
 * @returns Returns the UA tag if found, otherwise an empty string
 */
export function getUATag(stringToSearch: string): string[] {
  // const uATagRegex = /UA-\d{4,}-\d/;
  const uATagRegex = /UA-\d{4,}-\d/g;
  const match = stringToSearch.match(uATagRegex);
  return match ? match : [];
}

/**
 * Filters a list of HTTPRequests to only include requests that contain DAP
 * related tags or scripts.
 * 
 * @param allRequests An object containing all HTTPRequests made from the page
 * @returns A pruned down lust of HTTPRequests that contain DAP related tags or scripts
 */
export function getDapScriptCandidateRequests(logger: Logger, allRequests: HTTPRequest[]): HTTPRequest[] {
  const candidates: HTTPRequest[] = [];

  logger.info({funcion: 'getDapScriptCandidateRequests'}, 'Checking all requests for DAP script candidates');
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
      logger.info({funcion: 'getDapScriptCandidateRequests'}, 'Request is a DAP script candidate', { requestUrl });
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
export async function getDapScriptCandidates(logger: Logger, dapScriptCandidateRequests: HTTPRequest[]): Promise<DapScriptCandidate[]> {
  const candidates: DapScriptCandidate[] = [];

  for (const request of dapScriptCandidateRequests) {
    const url = request.url();
    const parsedUrl = new URL(url);

    const candidate: DapScriptCandidate = {
      body: null,
      parameters: parsedUrl.searchParams.toString() || '',
      postData: null,
      url: request.url(),
      version: "",
    };

    try {
      logger.info({funcion: 'getDapScriptCandidates'}, 'Getting response body for DAP script candidate', { url });
      candidate.body = await request.response().text();
    } catch (err) {
      logger.info({funcion: 'getDapScriptCandidates'}, 'Error getting response body for DAP script candidate', { url, err });
      candidate.body = '';
    }

    candidate.version = candidate.body !== null ? getDapVersion(candidate.body) : '';

    try {
      logger.info({funcion: 'getDapScriptCandidates'}, 'Getting post data for DAP script candidate', { url });
      candidate.postData = request.postData();
    } catch (err) {
      logger.info({funcion: 'getDapScriptCandidates'}, 'Error getting post data for DAP script candidate', { url, err });
    }

    candidates.push(candidate);
  }

  logger.info({funcion: 'getDapScriptCandidates'}, 'DAP script candidates found', { candidates });
  return candidates;
}

/**
 * This will return the best candidate for providing proper DAP analysis
 *
 * @param dapScriptCandidates A list of DapScriptCandidates that will be analyzed to determine best option
 * @returns The best DAP candidate based on a series of checks
 */
export function getBestCandidate(logger: Logger, dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate {
  const checks = [
    (candidate: DapScriptCandidate) => checkCandidateForScriptAndVersion(candidate) === true,
    (candidate: DapScriptCandidate) => checkCandidateForPropertyAndVersion(candidate) === true,
    (candidate: DapScriptCandidate) => candidate.version !== null,
    (candidate: DapScriptCandidate) => checkUrlForScriptNameMatch(candidate.url) === true,
    (candidate: DapScriptCandidate) => checkCandidateForAnyDapMatch(candidate) === true,
  ];

  let bestCandidate = null;
  let bestMatchLevel = 5;
  for (const candidate of dapScriptCandidates) {
    let matchLevel = -1;

    logger.info({funcion: 'getBestCandidate'}, 'Checking DAP script candidate', { candidate });
    for (let i = 0; i < checks.length; i++) {
      if (checks[i](candidate)) {
          logger.info({funcion: 'getBestCandidate'}, 'DAP script candidate passed check', { candidate, check: i });
          matchLevel = i;
          break;
      }
    }

    if (matchLevel < bestMatchLevel) {
      logger.info({funcion: 'getBestCandidate'}, 'DAP script candidate is the best match so far', { candidate });
      bestCandidate = candidate;
      bestMatchLevel = matchLevel;
    }

  }

  logger.info({funcion: 'getBestCandidate'}, 'Best DAP script candidate found', { bestCandidate });
  return bestCandidate;
}

/**
 * Check to see if the DapScriptCandidate contains the exact script URL and a version
 * 
 * @param candidate a DapScriptCandidate
 * @returns TRUE if the DapScriptCandidate contains the exact dap script URL and a version, FALSE otherwise
 */
export function checkCandidateForScriptAndVersion(candidate: DapScriptCandidate): boolean {
  const isExactScriptMatch = checkUrlForScriptNameMatch(candidate.url);
  const hasVersion = candidate.version !== null;
  return !!isExactScriptMatch && hasVersion;
}

/**
 * Check to see if the DapScriptCandidate URL contains GA properties and a version
 * 
 * @param candidate a DapScriptCandidate
 * @returns TRUE if the DapScriptCandidate URL contains GA properties and a version, FALSE otherwise
 */
export function checkCandidateForPropertyAndVersion(candidate: DapScriptCandidate): boolean {
  const isPropertyIdMatch = checkUrlForPropertyIdMatch(candidate.url);
  const isPostDataMatch = checkPostDataForPropertyIdMatch(candidate.postData);
  const hasVersion = candidate.version !== null;
  return !!(isPropertyIdMatch || isPostDataMatch)  && hasVersion;
}

/**
 * Check to see if the DapScriptCandidate contains any criteria that would consider it a DAP candidate
 * 
 * @param candidate a DapScriptCandidate
 * @returns TRUE if the DapScriptCandidate caontains any criteria that would consider it a DAP candidate, FALSE otherwise
 */
export function checkCandidateForAnyDapMatch(candidate: DapScriptCandidate): boolean {
  const hasVersion = candidate.version !== "";
  const isExactScriptMatch = checkUrlForScriptNameMatch(candidate.url);
  const isPropertyIdMatch = checkUrlForPropertyIdMatch(candidate.url);
  const isPostDataMatch = checkPostDataForPropertyIdMatch(candidate.postData);
  return !!isPropertyIdMatch || isPostDataMatch || isExactScriptMatch || hasVersion;
}

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
  if ( postData ===null || postData === undefined ) {
    return false;
  }
  return DAP_GA_PROPERTY_IDS.some((id) => postData.includes(id));
}
