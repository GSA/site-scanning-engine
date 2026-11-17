import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { browserInstance, newTestPageFromBody } from './test-helper';

describe('newTestPageFromBody', () => {
  const SLOW_RESPONSE_MS = 300;
  let server: Server;
  let slowUrl: string;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('ok');
      }, SLOW_RESPONSE_MS);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    slowUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/slow`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (browserInstance) {
      await browserInstance.close();
    }
  });

  it('waits for requests started by the body to finish before running the handler', async () => {
    let fetched: string | undefined;
    const body = `<script>
      fetch('${slowUrl}').then(() => { document.body.dataset.fetched = 'yes'; });
    </script>`;

    await newTestPageFromBody(async ({ page }) => {
      fetched = await page.evaluate(() => document.body.dataset.fetched);
    }, body);

    expect(fetched).toBe('yes');
  });
});
