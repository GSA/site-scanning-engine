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
  checkPostDataForPropertyIdMatch
} from './dap';
import {DapScan} from "../../../../entities/scan-data.entity";

const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');

const MOCK_REQUESTS: Record<string, HTTPRequest> = {
  realDapScript: createMockRequest(
      'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
      scriptContents
  )
};

const MOCK_REQUESTS_WITH_REAL_SCRIPT = [ MOCK_REQUESTS.realDapScript ];


describe('dap scan', () => {

  describe('buildDapResult()', () => {
    it('should detect the presence of DAP when passed a real DAP script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      expect(result.dapDetected).toEqual(true);
    });

    it('should correctly detect the presence of DAP, parameters and DAP version from a minified JS script', async () => {
      const result = await executeDapScanner([ MOCK_REQUESTS.realDapScript ]);
      //expect(result.dapVersion).toEqual("20240712 v8.2 - GA4");
      expect(result.dapVersion).toEqual("v8.2");
    });

    it('should correctly detect the presence of DAP when using GA tags', async () => {
      const result = await buildDapResult(
        mock<Logger>(), [
          mock<HTTPRequest>({
            response() {
              return {
                async text() {
                  return null;
                }
              } as HTTPResponse;
            },
            url: () => 'https://abcd-def/G-CSLL4ZEK4L/xyz',
          }),
        ]
      );
      expect(result).toEqual(
        {
          dapDetected: true,
          dapParameters: '',
          dapVersion: ''
        }
      );
    });

    it('should detect DAP if the analytics code is in the URL', async () => {
      const result = await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return null;
              }
            } as HTTPResponse;
          },
          url: () => 'https://abcd-def/G-CSLL4ZEK4L/xyz',
        }),
      ]);
      expect(result.dapDetected).toEqual(true);
    });
  
    it('should detect DAP if the analytics code is in the POST data', async () => {
      const result = await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return null;
              }
            } as HTTPResponse;
          },
          url: () => 'https://test.gov',
          postData: () => 'abcd-def/G-CSLL4ZEK4L/xyz',
        }),
      ]);
      expect(result.dapDetected).toEqual(true);
    });
    
    it('should extract DAP parameters from script hosted remotely', async () => {
      const result = await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return null;
              }
            } as HTTPResponse;
          },
          url: () =>
            'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]);
      expect(result.dapParameters).toEqual('test1=1&test2=2');
    });
  
    it('should extract DAP parameters from script hosted on the website', async () => {
      const result = await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return null;
              }
            } as HTTPResponse;
          },
          url: () =>
            'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]);
      expect(result.dapParameters).toEqual('test1=1&test2=2');
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
    it('should include the request if the script is hosted on the website', async () => {
      const result = await getDapScriptCandidateRequests([
        mock<HTTPRequest>(
          {
            url: () => 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          }
        ),
      ]);
      expect(result[0].url()).toEqual('https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2');
    });

    it('should include the request if the analytics code is in the URL', async () => {
      const result = await getDapScriptCandidateRequests([
        mock<HTTPRequest>(
          {
            url: () => 'abcd-def/G-CSLL4ZEK4L/xyz',
          }
        ),
      ]);
      expect(result[0].url()).toEqual('abcd-def/G-CSLL4ZEK4L/xyz');
    });
  });

  describe('getDapScriptCandidates()', () => {
    it('should return a list of DAP candidates based on the HTTPRequest for a hosted script', async () => {
      const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');
      const result = await getDapScriptCandidates([
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return scriptContents;
              }
            } as HTTPResponse;
          },
          url: () => 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]);
      expect(result).toEqual([
        {
          url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          parameters: 'test1=1&test2=2',
          body: scriptContents,
          version: '20240712 v8.2 - GA4',
        }
      ]);
    });

    it('should return a list of DAP candidates based on the HTTPRequest for requests containing GA codes', async () => {

      const result = await getDapScriptCandidates([
        mock<HTTPRequest>({
          response() {
            return {
              async text() {
                return null;
              }
            } as HTTPResponse;
          },
          url: () => 'https://abcd-def/G-CSLL4ZEK4L/xyz',
        }),
      ]);
      expect(result).toEqual([
        {
          url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
          parameters: '',
          body: null,
          version: ''
        }
      ]);
    });
  });

  describe('getBestCandidate()', () => {
    it('should include the request if the script is hosted on the website', async () => {
      const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');
      let testCandidate: DapScriptCandidate = {
        url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        parameters: 'test1=1&test2=2',
        body: scriptContents,
        version: '20240712 v8.2 - GA4',
      };
      const result = await getBestCandidate([
        testCandidate
      ]);
      expect(result).toEqual(
        {
          url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          parameters: 'test1=1&test2=2',
          body: scriptContents,
          version: '20240712 v8.2 - GA4',
        }
      );
    });

    it('should include the request if the script is hosted on the website', async () => {
      let testCandidate: DapScriptCandidate = {
        url: 'https://abcd-def/G-CSLL4ZEK4L/xyz',
        parameters: null,
        body: null,
        version: '20240712 v8.2 - GA4',
      };
      const result = await getBestCandidate([
        testCandidate
      ]);
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
        'abcd-def/does not have/xyz'
      ].forEach((testString) => {
        const result = checkPostDataForPropertyIdMatch(testString);
        expect(result).toEqual(true);

      })
      //
    });
  });

});

function createMockRequest(url: string, responseBody: string | null = "") {
  return mock<HTTPRequest>({
    response() {
      return {
        async text() {
          return responseBody;
        }
      } as HTTPResponse;
    },
    url: () => url,
  });
}

async function executeDapScanner( mockRequests: HTTPRequest[] ): Promise<DapScan> {
  return buildDapResult( mock<Logger>(), mockRequests );
}