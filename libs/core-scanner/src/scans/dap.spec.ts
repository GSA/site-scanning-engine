import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { getTestFileContents } from '../test-helper';

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
  checkCandidateForAnyDapMatch
} from './dap';
import {DapScan} from "../../../../entities/scan-data.entity";

const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');

const MOCK_REQUESTS: Record<string, HTTPRequest> = {
  realDapScript: createMockRequest(
    'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    scriptContents,
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
  
};

const MOCK_DAP_SCRIPT_CANDIDATES: Record<string, DapScriptCandidate> = {
  realScript: {
    url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    parameters: 'test1=1&test2=2',
    body: '',
    version: '20240712 v8.2 - GA4',
  },
  realScriptNoVersion: {
    url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    parameters: 'test1=1&test2=2',
    body: '',
    version: null,
  },
  gaTagsWithVersion: {
    url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
    parameters: null,
    body: null,
    version: '20240712 v8.2 - GA4',
  },
  gaTagsNoVersion: {
    url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
    parameters: null,
    body: null,
    version: null,
  },
  invalidCandidate: {
    url: 'https://no-dap/here',
    parameters: null,
    body: null,
    version: null,
  }
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
      expect(result.dapDetected).toEqual(true);
    });

    it('should detect the DAP version from a minified JS script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapVersion).toEqual("20240712 v8.2 - GA4");
    });

    it('should detect the DAP parameters from a minified JS script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapParameters).toEqual("test1=1&test2=2");
    });

    it('should detect the presence of DAP when using GA tags', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.gaTagsNoResponse ]);
      expect(result.dapDetected).toEqual(true);
    });
  
    it('should detect DAP if the analytics code is in the POST data', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.gaTagsInPostResponse ]);
      expect(result.dapDetected).toEqual(true);
    });

  });

  describe('getDapVersion()', () => {
    it('should correctly extract the version from a minified DAP script', async () => {
      const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');
      const result = getDapVersion(scriptContents);
      expect(result).toEqual('20240712 v8.2 - GA4');
    });

    it('should correctly extract the version from a non-minified DAP script', async () => {
      const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.js');
      const result = getDapVersion(scriptContents);
      expect(result).toEqual('20240524 v7.05 - Dual Tracking');
    });
  });

  describe('getDapScriptCandidateRequests()', () => {
    it('should include all requests containing DAP', async () => {
      const result = await getDapScriptCandidateRequests(MOCK_REQUESTS_WITH_DAP);
      expect(result.length).toEqual(3);
    });

    it('should only include the requests that contain DAP and filter out non DAP requests', async () => {
      const result = await getDapScriptCandidateRequests(ALL_MOCK_REQUESTS);
      expect(result.length).toEqual(3);
    });
  });

  describe('getDapScriptCandidates()', () => {
    it('should return an array of DapCandidateScripts', async () => {
      const result = await getDapScriptCandidates(MOCK_REQUESTS_WITH_DAP);
      expect(result.length).toEqual(3);
    });
  });

  describe('getBestCandidate()', () => {
    it('should return the candidate that contains the exact script match and version', async () => {
      const result = getBestCandidate(shuffleCandidates(ALL_DAP_SCRIPT_CANDIDATES));
      expect(result).toEqual(
        {
          url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          parameters: 'test1=1&test2=2',
          body: '',
          version: '20240712 v8.2 - GA4',
        }
      );
    });
    it('should return the candidate that GA properties in the url or POST data and has a version', async () => {
      const result = getBestCandidate(shuffleCandidates(DAP_SCRIPT_CANDIDATES_WITHOUT_REALSCRIPT));
      expect(result).toEqual(
        {
          url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
          parameters: null,
          body: null,
          version: '20240712 v8.2 - GA4',
        }
      );
    });
  });

  describe('checkUrlForScriptNameMatch()', () => {
    it('should return TRUE if the script is found', async () => {
      const scriptUrl = 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2'
      const result = checkUrlForScriptNameMatch(scriptUrl);
      expect(result).toEqual(true);
    });
  });

  describe('checkUrlForScriptNameMatch()', () => {
    it('should return TRUE if the GA properties in the url match', async () => {
      const url = 'https://abcd-def/G-CSLL4ZEK4L/xyz'
      const result = checkUrlForPropertyIdMatch(url);
      expect(result).toEqual(true);
    });
  });

  describe('checkPostDataForPropertyIdMatch()', () => {
    it('should return TRUE if the POST data contains the GA properties', async () => {
      [
        { testString: 'abcd-def/G-CSLL4ZEK4L/xyz', expectedResult: true },
        { testString: 'abcd-def/does not have/xyz', expectedResult: false },
      ].forEach((item) => {
        const result = checkPostDataForPropertyIdMatch(item.testString);
        expect(result).toEqual(item.expectedResult);
      })
    })
  });

  describe('checkCandidateForScriptAndVersion()', () => {
    it('should return TRUE if the candidate contains the exact script URL and a version, FALSE otherwise', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.realScript);
      expect(result).toEqual(true);
    });
    it('should return FALSE if the candidate is missing either the exact script URL or version', async () => {
      const result = checkCandidateForScriptAndVersion(MOCK_DAP_SCRIPT_CANDIDATES.realScriptNoVersion);
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

});

function createMockRequest(url: string, responseBody: string | null = "", postData: string | null = null) {
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
  return buildDapResult( mock<Logger>(), mockRequests );
}

function shuffleCandidates(dapScriptCandidates: DapScriptCandidate[]): DapScriptCandidate[] {
  let currentIndex = dapScriptCandidates.length;

  while (currentIndex !=0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [dapScriptCandidates[currentIndex], dapScriptCandidates[randomIndex]] = [
      dapScriptCandidates[randomIndex], dapScriptCandidates[currentIndex]];
  }

  return dapScriptCandidates;
}