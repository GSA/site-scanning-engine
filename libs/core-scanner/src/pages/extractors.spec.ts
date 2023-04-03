import { mock, MockProxy } from 'jest-mock-extended';
import {
  createOutboundRequestsExtractor,
  createCSSRequestsExtractor,
} from './extractors';
import { Page } from 'puppeteer';
import { Logger } from 'pino';

describe('extractors', () => {
  let mockPage: MockProxy<Page>;
  let mockLogger: MockProxy<Logger>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockPage = mock<Page>();
    mockLogger = mock<Logger>();
  });

  describe('createOutboundRequestsExtractor', () => {
    it('should return a function that returns an empty array when there are no outbound requests on the page', () => {
      const outboundRequestsExtractor =
        createOutboundRequestsExtractor(mockPage);
      expect(outboundRequestsExtractor()).toEqual([]);
    });
  });

  describe('createCSSRequestsExtractor', () => {
    it('should return a function that returns an empty array when there are no stylesheets in the response', async () => {
      const cssRequestsExtractor = await createCSSRequestsExtractor(
        mockPage,
        mockLogger,
      );
      expect(cssRequestsExtractor()).toEqual([]);
    });
  });
});
