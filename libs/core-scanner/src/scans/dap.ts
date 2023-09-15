import { Logger } from 'pino';
import { HTTPRequest } from 'puppeteer';
import { DapScan } from 'entities/scan-data.entity';

export const buildDapResult = async (
  logger: Logger,
  outboundRequests: HTTPRequest[],
): Promise<DapScan> => {
  const dapParameters = getDapParameters(outboundRequests);
  const dapDetected =
    getDapDetected(outboundRequests) || dapParameters !== null;

  logger.info({
    msg: 'dapParameters result:',
    dapParameters,
  });

  logger.info({
    msg: 'dapDetected result:',
    dapDetected,
  });

  return {
    dapDetected,
    dapParameters,
  };
};

const getDapParameters = (outboundRequests: HTTPRequest[]): string | null => {
  const dapScript = 'Universal-Federated-Analytics-Min.js';
  let parameters: string;

  for (const request of outboundRequests) {
    const requestUrl = request.url();

    if (requestUrl.includes(dapScript)) {
      const parsedUrl = new URL(requestUrl);
      parameters = parsedUrl.searchParams.toString();
      break;
    }
  }

  return typeof parameters === 'undefined' ? null : parameters;
};

/**
 * dapDetected looks to see if the Digital Analytics Program is detected on a page.
 *
 * It works by looking for the Google Analytics UA Identifier in either the URL or Post Data.
 * @param outboundRequests
 */
const getDapDetected = (outboundRequests: HTTPRequest[]): boolean => {
  const dapIds = ['UA-33523145-1', 'G-9TNNMGP8WJ'];
  let detected = false;

  for (const request of outboundRequests) {
    const urlIncludesId = dapIds.some((id) => request.url().includes(id));
    if (urlIncludesId) {
      detected = true;
      break;
    }

    try {
      const postDataIncludesId = dapIds.some((id) =>
        request.postData().includes(id),
      );
      if (postDataIncludesId) {
        detected = true;
        break;
      }
    } catch (error) {
      // fine to ignore if there's no post body.
    }
  }

  return detected;
};
