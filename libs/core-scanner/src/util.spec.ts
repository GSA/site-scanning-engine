import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';
import {
  getBaseDomain,
  getFullDomain,
  getHttpsUrl,
  getMIMEType,
  getWithSubdomain,
} from './util';

describe('core-scanner util', () => {
  describe('getBaseDomain', () => {
    it('gets the base domain for a url with one subdomain', () => {
      const url = 'https://18f.gsa.gov';
      const result = getBaseDomain(url);
      expect(result).toBe('gsa.gov');
    });

    it('gets the base domain for a url more than one subdomain', () => {
      const url = 'https://coastwatch.pfeg.noaa.gov';
      const result = getBaseDomain(url);
      expect(result).toBe('noaa.gov');
    });
  });

  describe('getFullDomain', () => {
    it('gets the full domain for a url with no subdomain', () => {
      const url = 'https://gsa.gov';
      const result = getFullDomain(url);
      expect(result).toBe('gsa.gov');
    });

    it('gets the full domain for a url with one subdomain', () => {
      const url = 'https://18f.gsa.gov';
      const result = getFullDomain(url);
      expect(result).toBe('18f.gsa.gov');
    });

    it('gets the full domain for a url more than one subdomain', () => {
      const url = 'https://coastwatch.pfeg.noaa.gov';
      const result = getFullDomain(url);
      expect(result).toBe('coastwatch.pfeg.noaa.gov');
    });
  });

  describe('getHttpsUrl', () => {
    it('adds https:// to a url that does not include a protocol', () => {
      const url = '18f.gsa.gov';
      const result = getHttpsUrl(url);
      expect(result).toBe('https://18f.gsa.gov');
    });

    it('does not add https:// to a url that does include a protocol', () => {
      const url = 'https://18f.gsa.gov';
      const result = getHttpsUrl(url);
      expect(result).toBe('https://18f.gsa.gov');
    });

    it('changes http:// to https:// for to a url that includes an http:// protocol', () => {
      const url = 'http://18f.gsa.gov';
      const result = getHttpsUrl(url);
      expect(result).toBe('https://18f.gsa.gov');
    });
  });

  describe('getMIMEType', () => {
    it('gets the MIME type of a Puppeteer HTTPResponse instance', () => {
      const mockResponse = mock<HTTPResponse>();
      mockResponse.headers.calledWith().mockReturnValue({
        'Content-Type': 'text/html; charset=utf-8',
      });
      const result = getMIMEType(mockResponse);
      expect(result).toBe('text/html');
    });
  });

  describe('getWithSubdomain', () => {
    it('gets the full domain and subdomain for a url with a subdomain', () => {
      const url = 'https://18f.gsa.gov';
      const result = getWithSubdomain(url);
      expect(result).toBe('18f.gsa.gov');
    });

    it('gets the full domain for a url with no subdomain', () => {
      const url = 'https://gsa.gov';
      const result = getWithSubdomain(url);
      expect(result).toBe('gsa.gov');
    });

    it('gets an empty string if the url passed in is a file', () => {
      const url = 'file:///18f_gov_dump.mht';
      const result = getWithSubdomain(url);
      expect(result).toBe('');
    });
  });
});
