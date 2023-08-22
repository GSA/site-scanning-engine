import * as http from 'http';
import * as https from 'https';
import { Logger } from 'pino';
import { SecurityScan } from 'entities/scan-data.entity';

export const securityScan = async (
  logger: Logger,
  urlPath: string,
): Promise<SecurityScan> => {
  const httpUrl = `http://${urlPath}`;
  const httpsUrl = `https://${urlPath}`;

  const httpsEnforced = await hasHttpsEnforced(httpUrl, logger);
  const hstsPreloading = await hasHstsPreloading(httpsUrl, logger);

  return { httpsEnforced, hstsPreloading };
};

const hasHttpsEnforced = async (url, logger): Promise<boolean> => {
  let httpsEnforced = false;
  try {
    const response = await new Promise<http.IncomingMessage>(
      (resolve, reject) => {
        http
          .get(url, (response) => {
            resolve(response);
          })
          .on('error', (error) => {
            reject(error);
          });
      },
    );

    if (response.statusCode === 301 || response.statusCode === 302) {
      const locationHeader = response.headers['location'];
      if (locationHeader && locationHeader.startsWith('https://')) {
        httpsEnforced = true;
      }
    }
  } catch (error) {
    logger.info({ msg: 'Error during httpsEnforced scan:', error });
  }

  logger.info({
    msg: 'httpsEnforced result:',
    httpsEnforced,
  });

  return httpsEnforced;
};

const hasHstsPreloading = async (url, logger): Promise<boolean> => {
  let hstsPreloading = false;

  try {
    const response = await new Promise<http.IncomingMessage>(
      (resolve, reject) => {
        https
          .get(url, (response) => {
            resolve(response);
          })
          .on('error', (error) => {
            reject(error);
          });
      },
    );

    if (response.headers['strict-transport-security']) {
      const hstsHeader = response.headers['strict-transport-security'];
      hstsPreloading = hstsHeader.includes('preload');
    }
  } catch (error) {
    logger.info({ msg: 'Error during hstsPreloading scan:', error });
  }

  logger.info({
    msg: 'hstsPreloading result:',
    hstsPreloading,
  });

  return hstsPreloading;
};
