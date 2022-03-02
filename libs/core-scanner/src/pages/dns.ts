import { promises as dns } from 'dns';
import { Logger } from 'pino';

export const dnsScan = (logger: Logger, hostname: string) => {
  return dns
    .resolve6(hostname)
    .then((response) => {
      logger.info('Resolved address is:', response);
      return true;
    })
    .catch((error) => {
      logger.info({ msg: 'No IPv6 record available', error });
      return false;
    });
};
