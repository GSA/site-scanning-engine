import { Logger } from 'pino';
import { has, uniq } from 'lodash';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';
import { getTruncatedUrl } from '../util';
import { logScanResult } from 'libs/logging/src/metric-utils';

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
  parentLogger: Logger,
  outboundRequests: HTTPRequest[],
): Promise<DapScan> => {
  const emptyResponse = {
    dapDetected: false,
    dapParameters: "",
    dapVersion: "",
    gaTagIds: "",
  };

  const logger = parentLogger.child({ function: 'buildDapResult' });

  const hasOutboundRequests = outboundRequests.length === 0;
  if(hasOutboundRequests) {
    logger.info('No outbound requests found.');
    return emptyResponse;
  }

  const allGAPropertyIds: string = getAllGAPropertyTags(logger, outboundRequests);
  const hasGaPropertyIds = allGAPropertyIds != '';
  if( hasGaPropertyIds ) {
    logScanResult(logger, {}, 'gaTagIds', allGAPropertyIds, 'GA Property IDs found');
  };

  const dapScriptCandidateRequests: HTTPRequest[] = getDapScriptCandidateRequests(logger, outboundRequests);
  const hasDapScriptCandidateRequests = dapScriptCandidateRequests.length != 0;
  if( !hasDapScriptCandidateRequests ) {
    logScanResult(logger, {}, 'dapDetected', false, 'DAP Not Detected');
  };

  if(!hasDapScriptCandidateRequests && !hasGaPropertyIds) {
    logger.info('Unable to locate dap script candidates or GA property IDs.');
    return emptyResponse;
  };
  
  if(!hasDapScriptCandidateRequests && hasGaPropertyIds) {
    logger.info(`No DAP script candidates found, but the following GA property IDs were detected: ${allGAPropertyIds}`);
    return {
      dapDetected: false,
      dapParameters: "",
      dapVersion: "",
      gaTagIds: allGAPropertyIds,
    };
  };

  const dapScriptCandidates: DapScriptCandidate[] = await getDapScriptCandidates(logger, dapScriptCandidateRequests);

  const dapScript: DapScriptCandidate = getBestCandidate(logger, dapScriptCandidates);
  const hasDapScript = dapScript !== null;
  if( hasDapScript ) {
    logScanResult(logger, {}, 'dapDetected', true, 'DAP Detected');
    logScanResult(logger, {}, 'dapParameters', dapScript.parameters, `DAP Parameters found: ${dapScript.parameters}`);
    logScanResult(logger, {}, 'dapVersion', dapScript.version, `DAP Version found: ${dapScript.version}`);
  };

  return {
    dapDetected: true,
    dapParameters: dapScript.parameters,
    dapVersion: dapScript.version,
    gaTagIds: allGAPropertyIds,
  };  

};

/**
 * Returns a comma-delimited string of all GA Property IDs found in the given requests
 * 
 * @param parentLogger A logger object
 * @param allRequests An object containing all HTTPRequests made from the page
 * @returns A comma-delimited string of all GA Property IDs found in the requests
 */
export function getAllGAPropertyTags(parentLogger: Logger, allRequests: HTTPRequest[]): string {
  let allGAPropertyIds: string[] = [];

  const logger = parentLogger.child({ function: 'getAllGAPropertyTags' });

  for (const request of allRequests) {
    const requestUrl = request.url();
    const postData = request.postData();

    if ( !requestUrl ) {
      continue;
    }
    
    if( getG4Tag(requestUrl).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getG4Tag(requestUrl));
    }
    if( getUATag(requestUrl).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getUATag(requestUrl));
    }
    if ( !postData ) {
      continue;
    }
    if ( getG4Tag(postData).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getG4Tag(postData));
    }
    if ( getUATag(postData).length !== 0 ) {
      allGAPropertyIds = allGAPropertyIds.concat(getUATag(postData));
    }
  }

  const uniqueGAPropertyIds = uniq(allGAPropertyIds);
  logger.info('GA Property IDs found: %s', JSON.stringify(uniqueGAPropertyIds));
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
 * @param stringToSearch The string that may contain a UA tag
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
 * @param parentLogger A logger object
 * @param allRequests An object containing all HTTPRequests made from the page
 * @returns A pruned down lust of HTTPRequests that contain DAP related tags or scripts
 */
export function getDapScriptCandidateRequests(parentLogger: Logger, allRequests: HTTPRequest[]): HTTPRequest[] {
  const candidates: HTTPRequest[] = [];
  const logger = parentLogger.child({ function: 'getDapScriptCandidateRequests' });

  for (const request of allRequests) {
    if(!checkForResponse(request)) {
      continue;
    }

    const requestUrl = request.url();
    const postData = request.postData();
    const isExactScriptMatch = checkUrlForScriptNameMatch(requestUrl);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(requestUrl);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(postData);
    const truncatedUrl = getTruncatedUrl(requestUrl, 40);

    if( isExactScriptMatch || isPropertyIdMatch || isPostDataMatch ) {
      logger.info(`Dap script candidate found: ${truncatedUrl}`);
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
 * @param parentLogger A logger object
 * @param dapScriptCandidateRequests An array of Puppeteer.HTTPRequest objects
 * @returns The requests passed in, but transformed into DapScriptCandidate objects.
 */
export async function getDapScriptCandidates(parentLogger: Logger, dapScriptCandidateRequests: HTTPRequest[]): Promise<DapScriptCandidate[]> {
  const candidates: DapScriptCandidate[] = [];
  const logger = parentLogger.child({ function: 'getDapScriptCandidates' });

  for (const request of dapScriptCandidateRequests) {
    const url = request.url();
    const parsedUrl = new URL(url);
    const truncatedUrl = getTruncatedUrl(url, 40);

    const candidate: DapScriptCandidate = {
      body: null,
      parameters: parsedUrl.searchParams.toString() || '',
      postData: null,
      url: request.url(),
      version: "",
    };

    try {
      candidate.body = await request.response().text();
    } catch (err) {
      logger.info({error: err},`Error getting response from candidate body: ${url}`);
      candidate.body = '';
    }

    candidate.version = candidate.body !== null ? getDapVersion(candidate.body) : '';

    try {
      candidate.postData = request.postData();
    } catch (err) {
      logger.info({error: err}, `Error getting post data for DAP script candidate: ${url}`);
    }

    logger.info(`DAP script candidate found: ${ truncatedUrl }`);
    candidates.push(candidate);
  }

  return candidates;
}

/**
 * This will return the best candidate for providing proper DAP analysis
 *
 * @param parentLogger A logger object
 * @param dapScriptCandidates A list of DapScriptCandidates that will be analyzed to determine best option
 * @returns The best DAP candidate based on a series of checks
 */
export function getBestCandidate(parentLogger: Logger, dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate {
  const logger = parentLogger.child({ function: 'getBestCandidate' });
  const checks = [
    {
      name: 'Script and Version',
      check: (candidate: DapScriptCandidate) => checkCandidateForScriptAndVersion(candidate) === true,
    },
    {
      name: 'Property and Version',
      check: (candidate: DapScriptCandidate) => checkCandidateForPropertyAndVersion(candidate) === true,
    },
    {
      name: 'Version',
      check: (candidate: DapScriptCandidate) => candidate.version !== null,
    },
    {
      name: 'Script Name Match',
      check: (candidate: DapScriptCandidate) => checkUrlForScriptNameMatch(candidate.url) === true,
    },
    {
      name: 'Any DAP Match',
      check: (candidate: DapScriptCandidate) => checkCandidateForAnyDapMatch(candidate) === true,
    },
  ];

  let bestCandidate = null;
  let bestMatchLevel = 5;
  for (const candidate of dapScriptCandidates) {
    let matchLevel = -1;
    const truncatedUrl = getTruncatedUrl(candidate.url, 40);

    for (let i = 0; i < checks.length; i++) {
      if (checks[i].check(candidate)) {
          logger.debug(`DAP script candidate passed check: ${checks[i].name}`);
          matchLevel = i;
          break;
      }
    }

    if (matchLevel < bestMatchLevel) {
      logger.debug(`DAP script candidate is the best match so far: ${truncatedUrl}`);
      bestCandidate = candidate;
      bestMatchLevel = matchLevel;
    }

  }

  const truncatedBestCandidateUrl = getTruncatedUrl(bestCandidate.url, 40);
  logger.info(`Best DAP script candidate found: ${ truncatedBestCandidateUrl }`);
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
 * @returns TRUE if the DapScriptCandidate contains any criteria that would consider it a DAP candidate, FALSE otherwise
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
