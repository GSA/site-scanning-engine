import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { getTestFileContents, mockLogger } from '../test-helper';

import { 
  buildDapResult,
  getDapVersion,
  getDapScriptCandidateRequests,
  getDapScriptCandidates,
  DapScriptCandidate,
  getBestCandidate,
  checkUrlForScriptNameMatch,
  checkUrlForPropertyIdMatch,
  checkPostDataForPropertyIdMatch,
  checkCandidateForScriptAndVersion,
  checkCandidateForPropertyAndVersion,
  checkCandidateForAnyDapMatch,
  getAllGAPropertyTags,
  getG4Tag,
  getUATag,
} from './dap';
import {DapScan} from '../../../../entities/scan-data.entity';

const minifiedScriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');
const nonMinifiedScriptContents = getTestFileContents('dap/Universal-Federated-Analytics.js');

const MOCK_REQUESTS: Record<string, HTTPRequest> = {
  realDapScript: createMockRequest(
    'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    minifiedScriptContents,
  ),
  gaTagsNoResponse: createMockRequest(
    'https://abcd-def/G-CSLL4ZEK4L/xyz',
    null,
  ),
  gaTagsInPostResponse: createMockRequest(
    'https://test.gov',
    null,
    'abcd-def/G-CSLL4ZEK4L/xyz',
  ),
  doesNotContainDap: createMockRequest(
    'https://no-dap/here',
    null,
  ),
  notRealGATagFirst: createMockRequest(
    'https://abcd-def/G-PI9UT7YUAT/xyz',
    null,
  ),
  notRealGATagSecond: createMockRequest(
    'https://abcd-def/G-QNT3KRC6EB/xyz',
    null,
  ),
  notRealGATagInPostResponse: createMockRequest(
    'https://test.gov',
    null,
    'abcd-def/G-QNT3FIU6EB/xyz',
  ),
  notRealUniversalGATagFirst: createMockRequest(
    'https://abcd-def/UA-33523145-1/xyz',
    null,
  ),
  notRealUniversalGATagSecond: createMockRequest(
    'https://abcd-def/UA-842976-1/xyz',
    null,
  ),
  notRealUniversalGATagInPostResponse: createMockRequest(
    'https://test.gov',
    null,
    'abcd-def/UA-8427660-1/xyz',
  ),
  notRealBothTags: createMockRequest(
    'https://abcd-def/UA-842645-1/G-QNT2XPC6EB/xyz',
    null,
  ),
};

const MOCK_DAP_SCRIPT_CANDIDATES: Record<string, DapScriptCandidate> = {
  realScript: {
    url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    parameters: 'test1=1&test2=2',
    body: minifiedScriptContents,
    version: '20240712 v8.2 - GA4',
    dapDetected: false,
  },
  realNonMinifiedScript: {
    url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    parameters: 'test1=1&test2=2',
    body: nonMinifiedScriptContents,
    version: '20240712 v8.2 - GA4',
    dapDetected: false,
  },
  realScriptNoVersion: {
    url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    parameters: 'test1=1&test2=2',
    body: '',
    version: null,
    dapDetected: false,
  },
  gaTagsWithVersion: {
    url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
    parameters: null,
    body: null,
    version: '20240712 v8.2 - GA4',
    dapDetected: true,
  },
  gaTagsNoVersion: {
    url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
    parameters: null,
    body: null,
    version: null,
    dapDetected: true,
  },
  invalidUrlWithVersion: {
    url: 'https://no-dap/here',
    parameters: null,
    body: null,
    version: '20240712 v8.2 - GA4',
    dapDetected: false,
  },
  invalidCandidate: {
    url: 'https://no-dap/here',
    parameters: null,
    body: null,
    version: null,
    dapDetected: false,
  },
}

const MOCK_REQUESTS_WITH_DAP = [
  MOCK_REQUESTS.realDapScript,
  MOCK_REQUESTS.gaTagsNoResponse,
  MOCK_REQUESTS.gaTagsInPostResponse,
];
const ALL_MOCK_REQUESTS = [
  MOCK_REQUESTS.realDapScript,
  MOCK_REQUESTS.gaTagsNoResponse,
  MOCK_REQUESTS.gaTagsInPostResponse,
  MOCK_REQUESTS.doesNotContainDap,
];
const MOCK_REQUESTS_WITH_GA_TAGS = [
  MOCK_REQUESTS.gaTagsNoResponse,
  MOCK_REQUESTS.gaTagsInPostResponse,
  MOCK_REQUESTS.notRealGATagFirst,
  MOCK_REQUESTS.notRealGATagSecond,
  MOCK_REQUESTS.notRealUniversalGATagFirst,
  MOCK_REQUESTS.notRealUniversalGATagSecond,
  MOCK_REQUESTS.notRealGATagInPostResponse,
  MOCK_REQUESTS.notRealUniversalGATagInPostResponse,
  MOCK_REQUESTS.notRealBothTags,
];

const ALL_DAP_SCRIPT_CANDIDATES = [
  MOCK_DAP_SCRIPT_CANDIDATES.realScript,
  MOCK_DAP_SCRIPT_CANDIDATES.realScriptNoVersion,
  MOCK_DAP_SCRIPT_CANDIDATES.gaTagsWithVersion,
  MOCK_DAP_SCRIPT_CANDIDATES.gaTagsNoVersion,
];

const DAP_SCRIPT_CANDIDATES_WITHOUT_REALSCRIPT = [
  MOCK_DAP_SCRIPT_CANDIDATES.realScriptNoVersion,
  MOCK_DAP_SCRIPT_CANDIDATES.gaTagsWithVersion,
  MOCK_DAP_SCRIPT_CANDIDATES.gaTagsNoVersion,
];

describe('dap scan', () => {

  describe('buildDapResult()', () => {
    it('should detect the presence of DAP when passed a real DAP script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapDetected).toEqual(false);
    });

    it('should detect the DAP version from a minified JS script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapVersion).toEqual('20240712 v8.2 - GA4');
    });

    it('should detect the DAP parameters from a minified JS script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapParameters).toEqual('test1=1&test2=2');
    });

    it('should detect the presence of DAP when using GA tags', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.gaTagsNoResponse ]);
      expect(result.dapDetected).toEqual(true);
    });
  
    it('should detect DAP if the analytics code is in the POST data', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.gaTagsInPostResponse ]);
      expect(result.dapDetected).toEqual(true);
    });

    it('should return GA tags', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.notRealBothTags ]);
      expect(result.gaTagIds).toEqual('G-QNT2XPC6EB,UA-842645-1');
    });

    it('should not detect the presence of DAP', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.notRealBothTags ]);
      expect(result.dapDetected).toEqual(false);
    });

  });

  describe('getDapVersion()', () => {
    it('should correctly extract the version from a minified DAP script', async () => {
      const result = getDapVersion(MOCK_DAP_SCRIPT_CANDIDATES.realScript.body);
      expect(result).toEqual('20240712 v8.2 - GA4');
    });

    it('should correctly extract the version from a non-minified DAP script', async () => {
      const result = getDapVersion(MOCK_DAP_SCRIPT_CANDIDATES.realNonMinifiedScript.body);
      expect(result).toEqual('20240524 v7.05 - Dual Tracking');
    });
  });

  describe('getAllGAPropertyIds()', () => {
    it('should return an comma delimited list of GA property IDs', async () => {
      const result = getAllGAPropertyTags(mockLogger, MOCK_REQUESTS_WITH_GA_TAGS);
      expect(result).toEqual('G-CSLL4ZEK4L,G-PI9UT7YUAT,G-QNT3KRC6EB,UA-33523145-1,UA-842976-1,G-QNT3FIU6EB,UA-8427660-1,G-QNT2XPC6EB,UA-842645-1');
    });
  });

  describe('getDapScriptCandidateRequests()', () => {
    it('should include all requests containing DAP', async () => {
      const result = getDapScriptCandidateRequests(mockLogger, MOCK_REQUESTS_WITH_DAP);
      expect(result.length).toEqual(3);
    });

    it('should only include the requests that contain DAP and filter out non DAP requests', async () => {
      const result = getDapScriptCandidateRequests(mockLogger, ALL_MOCK_REQUESTS);
      expect(result.length).toEqual(3);
    });
  });

  describe('getDapScriptCandidates()', () => {
    it('should return an array of DapCandidateScripts', async () => {
      const result = await getDapScriptCandidates(mockLogger, MOCK_REQUESTS_WITH_DAP);
      expect(result.length).toEqual(3);
    });
  });

  describe('getBestCandidate()', () => {
    it('should return the candidate that contains the exact script match and version', async () => {
      const result = getBestCandidate(mockLogger, ALL_DAP_SCRIPT_CANDIDATES);
      expect(result.url).toEqual('https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2');
    });
    it('should return a candidate that best matches the criteria', async () => {
      const result = getBestCandidate(mockLogger, DAP_SCRIPT_CANDIDATES_WITHOUT_REALSCRIPT);
      expect(result.version).toEqual('20240712 v8.2 - GA4');
    });
  });

  describe('checkUrlForScriptNameMatch()', () => {
    it('should return TRUE if the script is found', async () => {
      const scriptUrl = 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2'
      const result = checkUrlForScriptNameMatch(scriptUrl);
      expect(result).toEqual(true);
    });
    it('should return FALSE if the script is not found', async () => {
      const scriptUrl = 'https://test.gov/script-is-not-included?test1=1&test2=2'
      const result = checkUrlForScriptNameMatch(scriptUrl);
      expect(result).toEqual(false);
    });
  });

  describe('checkUrlForPropertyIdMatch()', () => {
    it('should return TRUE if the GA properties in the url match', async () => {
      const url = 'https://abcd-def/G-CSLL4ZEK4L/xyz'
      const result = checkUrlForPropertyIdMatch(url);
      expect(result).toEqual(true);
    });
    it('should return TRUE if the GA properties in the url match', async () => {
      const url = 'https://abcd-def/not-a-property/xyz'
      const result = checkUrlForPropertyIdMatch(url);
      expect(result).toEqual(false);
    });
  });

  describe('checkPostDataForPropertyIdMatch()', () => {
    it('should return TRUE if the POST data contains the GA properties', async () => {
      const result = checkPostDataForPropertyIdMatch('abcd-def/G-CSLL4ZEK4L/xyz');
      expect(result).toEqual(true);
    });
    it('should return FALSE if the POST data does not contain the GA properties', async () => {
      const result = checkPostDataForPropertyIdMatch('abcd-def/does not have/xyz');
      expect(result).toEqual(false);
    });
  });

  describe('checkCandidateForScriptAndVersion()', () => {
    it('should return TRUE if the candidate contains the exact script URL/GA tag and a version, FALSE otherwise', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.realScript);
      expect(result).toEqual(true);
    });
    it('should return FALSE if the candidate is missing the version', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.realScriptNoVersion);
      expect(result).toEqual(false);
    });
    it('should return FALSE if the candidate is missing a valid script/GA Tag', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.invalidUrlWithVersion);
      expect(result).toEqual(false);
    });
    it('should return FALSE if the candidate is missing both a valid script/GA Tag and version', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.invalidCandidate);
      expect(result).toEqual(false);
    });
  });

  describe('checkCandidateForPropertyAndVersion()', () => {
    it('should return TRUE if the candidate contains GA properties and a version, FALSE otherwise', async () => {
      const result = checkCandidateForPropertyAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.gaTagsWithVersion);
      expect(result).toEqual(true);
    });
    it('should return FALSE if the candidate is missing either GA properties or version', async () => {
      const result = checkCandidateForPropertyAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.gaTagsNoVersion);
      expect(result).toEqual(false);
    });
  });
  
  describe('checkCandidateForAnyDapMatch()', () => {
    it('should return TRUE if the candidate contains any DAP related criteria, FALSE otherwise', async () => {
      const result = checkCandidateForAnyDapMatch(MOCK_DAP_SCRIPT_CANDIDATES.gaTagsNoVersion);
      expect(result).toEqual(true);
    });
    it('should return FALSE if the candidate has no DAP related criteria', async () => {
      const result = checkCandidateForPropertyAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.invalidCandidate);
      expect(result).toEqual(false);
    });
  });

  describe('getG4Tag()', () => {
    it('should return the G4 tag contained in the url, empty string otherwise', async () => {
      const result = getG4Tag('https://abcd-def/G-CSLL4ZEK4L/xyz');
      expect(result).toEqual(['G-CSLL4ZEK4L']);
    });
    it('should return multiple G4 tags contained in the url, empty string otherwise', async () => {
      const result = getG4Tag('https://abcd-def/G-CSLL4ZEK4L/G-CSLLYBUS4L/xyz');
      expect(result).toEqual(['G-CSLL4ZEK4L','G-CSLLYBUS4L']);
    });
    it('should return the an empty string if a G4 tag is not contained in the url', async () => {
      const result = getG4Tag('https://abcd-def/no-tag-here/xyz');
      expect(result).toEqual([]);
    });
  });

  describe('getUATag()', () => {
    it('should return the UA tag contained in the url, empty string otherwise', async () => {
      const result = getUATag('https://abcd-def/UA-33523145-1/xyz');
      expect(result).toEqual(['UA-33523145-1']);
    });
    it('should return multiple UA tags contained in the url, empty string otherwise', async () => {
      const result = getUATag('https://abcd-def/UA-33523145-1/UA-33523145-2/xyz');
      expect(result).toEqual(['UA-33523145-1','UA-33523145-2']);
    });
    it('should return the an empty string if a UA tag is not contained in the url', async () => {
      const result = getUATag('https://abcd-def/no-tag-here/xyz');
      expect(result).toEqual([]);
    });
  });
});

function createMockRequest(url: string, responseBody: string | null = '', postData: string | null = null) {
  return mock<HTTPRequest>({
    response() {
      return {
        async text() {
          return responseBody;
        }
      } as HTTPResponse;
    },
    url: () => url,
    postData: () => postData,
  });
}

async function executeDapScanner( mockRequests: HTTPRequest[] ): Promise<DapScan> {
  return buildDapResult( mockLogger, mockRequests );
}