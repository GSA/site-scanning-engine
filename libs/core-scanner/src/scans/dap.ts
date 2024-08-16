import { Logger } from 'pino';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';

type DapDetectionResult = {
  detected: boolean,
  request: HTTPRequest | null
}

type DapParameterResults = {
  dapParameters: string | null,
  request: HTTPRequest | null
}

type DapScriptCandidate = {
  url: string,
  parameters: string,
  body: string,
  version?: string | null;
}

const DAP_SCRIPT_NAME = 'Universal-Federated-Analytics-Min.js';
const DAP_GA_PROPERTY_IDS = ['G-CSLL4ZEK4L'];

export const buildDapResult = async (
  logger: Logger,
  outboundRequests: HTTPRequest[],
): Promise<DapScan> => {

  const dapScriptCandidateRequests: HTTPRequest[] = getDapScriptCandidateRequests(outboundRequests);

  // We eliminate the puppeteer-specific objects as quickly as possible to
  // me the subsequent code more testable.
  const dapScriptCandidates: DapScriptCandidate[] = await getDapScriptCandidates(dapScriptCandidateRequests);
  // ^ do version check in here

  // Find the best candidate.
  // 1. Exact name match AND version is detected
  // 2. Property ID match (in url OR post body) AND version detected
  // 3. Anything with verion detected
  // 4. Exact name match without version
  // 5. Any match

  const dapScript: DapScriptCandidate | null = getBestCandidate(dapScriptCandidates);

  // Exit early
  if(dapScript === null) {
    return {
      dapDetected: false,
      dapParameters: "",
      dapVersion: ""
    };
  }

  // Get the parameters

  // Get the version

  // Return the stuff

  // --


  // const dapParameterResults = getDapParameters(outboundRequests);
  // const dapDetectionResult = getDapDetected(outboundRequests);
  // const hasDapParameters = dapParameterResults.dapParameters !== null;
  // const isDapDetected = dapDetectionResult.detected || hasDapParameters;
  // let dapVersion = '';
  // let dapScriptResponse = null;
  //
  // if (isDapDetected) {
  //   dapScriptResponse = dapDetectionResult.request !== null ? dapDetectionResult.request.response() : dapParameterResults.request.response();
  // }
  //
  // if (dapScriptResponse) {
  //   const dapScriptText = await dapScriptResponse.text();
  //   dapVersion = getDapVersion(dapScriptText);
  // }
  //
  // logger.info({
  //   msg: 'dapParameters result:',
  //   dapParameters: dapParameterResults.dapParameters,
  // });
  //
  // logger.info({
  //   msg: 'dapDetected result:',
  //   dapDetected: dapDetectionResult,
  // });
  //
  // logger.info({
  //   msg: 'dapVersion result:',
  //   dapDetected: dapVersion,
  // });
  //
  // return {
  //   dapDetected: isDapDetected,
  //   dapParameters: dapParameterResults.dapParameters,
  //   dapVersion,
  // };
};

const getDapParameters = (outboundRequests: HTTPRequest[]): DapParameterResults => {
  let parameterResult: DapParameterResults = {
    dapParameters: null,
    request: null
  };

  for (const request of outboundRequests) {
    const requestUrl = request.url();

    if (requestUrl.includes(DAP_SCRIPT_NAME)) {
      const parsedUrl = new URL(requestUrl);
      parameterResult.dapParameters = parsedUrl.searchParams.toString();
      parameterResult.request = request;
      break;
    }
  }

  return parameterResult;
};

/**
 * dapDetected looks to see if the Digital Analytics Program is detected on a page.
 *
 * It works by looking for the Google Analytics UA Identifier in either the URL or Post Data.
 * @param outboundRequests
 */
const getDapDetected = (outboundRequests: HTTPRequest[]): DapDetectionResult => {
  const dapIds = ['G-CSLL4ZEK4L'];
  let detectionResult: DapDetectionResult = {
    detected: false,
    request: null
  };

  for (const request of outboundRequests) {
    const urlIncludesId = dapIds.some((id) => request.url().includes(id));
    if (urlIncludesId) {
      detectionResult.detected = true;
      detectionResult.request = request;
      break;
    }

    try {
      const postDataIncludesId = dapIds.some((id) =>
        request.postData().includes(id),
      );
      if (postDataIncludesId) {
        detectionResult.detected = true;
        detectionResult.request = request;
        break;
      }
    } catch (error) {
      // fine to ignore if there's no post body.
    }
  }

  return detectionResult;
};

export function getDapVersion(dapScriptText: string): string {
  const versionRegex = /VERSION\s*:\s*['"]([^'"]+)['"]/;
  const match = dapScriptText.match(versionRegex);
  return match ? match[1] : '';
}

// --------------------

export function getDapScriptCandidateRequests(outboundRequests: HTTPRequest[]): HTTPRequest[] {
  let returnCandidates: HTTPRequest[] = [];

  for (const request of outboundRequests) {
    const requestUrl = request.url();
    const postData = request.postData();

    const isExactScriptMatch = checkUrlForScriptNameMatch(requestUrl);
    const isPropertyIdMatch = checkUrlForPropertyIdMatch(requestUrl);
    const isPostDataMatch = checkPostDataForPropertyIdMatch(postData);

    if( isExactScriptMatch || isPropertyIdMatch || isPostDataMatch ) {
      returnCandidates.push(request);
    }
  }

  return returnCandidates;
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

export function checkUrlForPropertyIdMatch(url: string): boolean {
  return DAP_GA_PROPERTY_IDS.some((id) => url.includes(id));
}

export function checkPostDataForPropertyIdMatch(postData: string): boolean {
  try {
    return DAP_GA_PROPERTY_IDS.some((id) => postData.includes(id));
  } catch () {
    return false;
  }
}

// ------------------

export async function getDapScriptCandidates(dapScriptCandidateRequests: HTTPRequest[]): Promise<DapScriptCandidate[]> {
  let returnCandidates: DapScriptCandidate[] = [];

  for (const request of dapScriptCandidateRequests) {
    const requestUrl = request.url();
    let returnCandidate: DapScriptCandidate;
    returnCandidate.url = requestUrl;

    const parsedUrl = new URL(requestUrl);
    returnCandidate.parameters = parsedUrl.searchParams.toString();

    const response = request.response();
    returnCandidate.body = await response.text();

    returnCandidates.push(returnCandidate);
  }


  // type DapScriptCandidate = {
  //   url: string,
  //   parameters: string,
  //   body: string,
  // }
  return returnCandidates;
}

export function getBestCandidate(dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate {

  let returnCandidate: DapScriptCandidate = null;

  return returnCandidate;
}


/*

 Identify all possible DAP scripts
 Narrow that list down to the most likely dap script

 if none are found -> dap is not detected

 if one is found
 - extract the version
 - extract the paramters

 */