import { Logger } from '@nestjs/common';

/**
 * "Humble" function that fetches security data from a given URL.
 * https://martinfowler.com/bliki/HumbleObject.html
 */
export async function fetchSecurityData(
  url: string,
  logger: Logger,
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    const err = error as Error;
    logger.error(`An error occurred fetching security data: ${err.message}`);
    return null;
  }
}
