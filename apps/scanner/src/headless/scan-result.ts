import { URL } from 'url';
import * as _ from 'lodash';

export class ScanResult {
  constructor(
    private targetUrl: string,
    private finalUrl: string,
    private finalUrlStatusCode: number,
    private redirectChain: string[],
    readonly agency: string,
    readonly branch: string,
  ) {}

  private getBaseDomain(url: string): string {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const split = hostname.split('.');
    const baseDomain = _.join(_.takeRight(split, 2), '.');
    return baseDomain;
  }

  get target() {
    const redirects = this.redirectChain.length > 0;
    const baseDomain = this.getBaseDomain(this.targetUrl);
    return {
      url: this.targetUrl,
      baseDomain: baseDomain,
      redirects: redirects,
      redirectChain: this.redirectChain,
    };
  }

  get final() {
    const baseDomain = this.getBaseDomain(this.finalUrl);
    return {
      url: this.finalUrl,
      baseDomain: baseDomain,
      statusCode: this.finalUrlStatusCode,
    };
  }

  toJSON() {
    return {
      agency: this.agency,
      branch: this.branch,
      target: this.target,
      final: this.final,
    };
  }
}
