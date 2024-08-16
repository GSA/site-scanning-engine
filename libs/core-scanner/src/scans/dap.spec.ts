import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { getTestFileContents } from '../test-helper';

import { buildDapResult, getDapVersion, getDapScriptCandidateRequests, getDapScriptCandidates, getBestCandidate } from './dap';

describe('dap scan', () => {

  describe('buildDapResult()', () => {
    // it('should correctly extract the version from a minified DAP script', async () => {
    //   const scriptContents = getTestFileContents('dap/Universal-Federated-Analytics.min.js');
    //   const result = await buildDapResult(
    //     mock<Logger>(), [
    //       mock<HTTPRequest>({
    //         response() {
    //           return {
    //             async text() {
    //               return scriptContents;
    //             }
    //           } as HTTPResponse;
    //         },
    //         url: () => 'abcd-def/UA-33523145-1/xyz',
    //       }),
    //     ]
    //   );
    //   expect(result.dapVersion).toEqual('20240712 v8.2 - GA4');
    // });

    // it('should detect DAP if the analytics code is in the URL', async () => {
    //   const result = await buildDapResult(mock<Logger>(), [
    //     mock<HTTPRequest>({
    //       url: () => 'abcd-def/UA-33523145-1/xyz',
    //     }),
    //   ]);
    //   expect(result.dapDetected).toEqual(true);
    // });
  
    // it('should detect DAP if the analytics code is in the POST data', async () => {
    //   const result = await buildDapResult(mock<Logger>(), [
    //     mock<HTTPRequest>({
    //       url: () => 'https://test.gov',
    //       postData: () => 'abcd-def/UA-33523145-1/xyz',
    //     }),
    //   ]);
    //   expect(result.dapDetected).toEqual(true);
    // });
  
    // it('should detect DAP if a different analytics code is in the POST data', async () => {
    //   const result = await buildDapResult(mock<Logger>(), [
    //     mock<HTTPRequest>({
    //       url: () => 'https://test.gov',
    //       postData: () => 'abcd-def/G-9TNNMGP8WJ/xyz',
    //     }),
    //   ]);
    //   expect(result.dapDetected).toEqual(true);
    // });
  
    // it('should extract DAP parameters from script hosted remotely', async () => {
    //   const result = await buildDapResult(mock<Logger>(), [
    //     mock<HTTPRequest>({
    //       url: () =>
    //         'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    //     }),
    //   ]);
    //   expect(result.dapParameters).toEqual('test1=1&test2=2');
    // });
  
    // it('should extract DAP parameters from script hosted on the website', async () => {
    //   const result = await buildDapResult(mock<Logger>(), [
    //     mock<HTTPRequest>({
    //       url: () =>
    //         'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
    //     }),
    //   ]);
    //   expect(result.dapParameters).toEqual('test1=1&test2=2');
    // });

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
    it('should include the request if the script is hosted on the website', async () => {
      const result = await getDapScriptCandidates([
        mock<HTTPRequest>(
          {
            url: () => 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          }
        ),
      ]);
      expect(result).toEqual([
        {
          url: 'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
          parameters: 'test1=1&test2=2',
          body: null
        }
      ]);
    });

    it('should include the request if the analytics code is in the URL', async () => {
      const result = await getDapScriptCandidates([
        mock<HTTPRequest>(
          {
            url: () => 'abcd-def/G-CSLL4ZEK4L/xyz',
          }
        ),
      ]);
      expect(result).toEqual([
        {
          url: 'abcd-def/G-CSLL4ZEK4L/xyz',
          parameters: null,
          body: null
        }
      ]);
    });
  });

});