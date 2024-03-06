import { Logger } from 'pino';
import { getHttpsUrl } from '../util';
import { CoreInputDto } from '../core.input.dto';
import { Page } from 'puppeteer';
import { AccessibilityScan } from 'entities/scan-data.entity';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { Result } from 'axe-core';

export const createAccessibilityScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  logger.info('Starting a11y scan...');

  return async (page: Page): Promise<AccessibilityScan> => {
    page.on('console', (message) => console.log('PAGE LOG:', message.text()));
    page.on('error', (error) => console.log('ERROR LOG:', error));

    await page.goto(getHttpsUrl(input.url));

    const axeScanResult = await new AxePuppeteer(page).analyze();
    const violations = axeScanResult.violations;

    const [accessibilityViolations, accessibilityViolationsList] =
      aggregateViolations(violations);

    return {
      accessibilityViolations,
      accessibilityViolationsList,
    };
  };
};

function aggregateViolations(violations: Result[]): string[] {
  const summary = {};
  const relevantViolations = [];

  violations.forEach((violation) => {
    switch (violation.id) {
      case 'aria-allowed-attr':
      case 'aria-deprecated-role':
      case 'aria-hidden-body':
      case 'aria-hidden-focus':
      case 'aria-prohibited-attr':
      case 'aria-required-attr':
      case 'aria-required-children':
      case 'aria-required-parent':
      case 'aria-roles':
      case 'aria-tooltip-name':
      case 'aria-valid-attr-value':
      case 'aria-valid-attr':
        summary['aria'] = summary['aria'] ? summary['aria'] + 1 : 1;
        relevantViolations.push(violation);
      case 'meta-refresh':
        summary['auto-updating'] = summary['auto-updating']
          ? summary['auto-updating'] + 1
          : 1;
        relevantViolations.push(violation);

      case 'color-contrast':
        summary['contrast'] = summary['contrast'] ? summary['contrast'] + 1 : 1;
        relevantViolations.push(violation);

      case 'blink':
      case 'marquee':
        summary['flash'] = summary['flash'] ? summary['flash'] + 1 : 1;
        relevantViolations.push(violation);

      case 'aria-input-field-name':
      case 'input-field-name':
      case 'select-name':
        summary['form-names'] = summary['form-names']
          ? summary['form-names'] + 1
          : 1;
      case 'frame-title':
        summary['frames-iframes'] = summary['frames-iframes']
          ? summary['frames-iframes'] + 1
          : 1;
        relevantViolations.push(violation);

      case 'area-alt':
      case 'image-alt':
      case 'input-image-alt':
      case 'object-alt':
      case 'role-img-alt':
      case 'svg-img-alt':
        summary['images'] = summary['images'] ? summary['images'] + 1 : 1;
        relevantViolations.push(violation);

      case 'frame-focusable-content':
      case 'scrollable-region-focusable':
        summary['keyboard-access'] = summary['keyboard-access']
          ? summary['keyboard-access'] + 1
          : 1;
        relevantViolations.push(violation);

      case 'html-lang-valid':
      case 'valid-lang':
      case 'html-has-lang':
        summary['language'] = summary['language'] ? summary['language'] + 1 : 1;
        relevantViolations.push(violation);

      case 'link-name':
        summary['link-purpose'] = summary['link-purpose']
          ? summary['link-purpose'] + 1
          : 1;
        relevantViolations.push(violation);

      case 'definition-list':
      case 'dlitem':
      case 'list':
      case 'listitem':
        summary['lists'] = summary['lists'] ? summary['lists'] + 1 : 1;
        relevantViolations.push(violation);

      case 'document-title':
        summary['page-titled'] = summary['page-titled']
          ? summary['page-titled'] + 1
          : 1;
        relevantViolations.push(violation);

      case 'td-headers-attr':
      case 'th-has-data-cells':
        summary['tables'] = summary['tables'] ? summary['tables'] + 1 : 1;
        relevantViolations.push(violation);

      case 'aria-command-name':
      case 'aria-meter-name':
      case 'aria-progressbar-name':
      case 'aria-toggle-field-name':
      case 'button-name':
        summary['user-control-name'] = summary['user-control-name']
          ? summary['user-control-name'] + 1
          : 1;
        relevantViolations.push(violation);
    }
  });

  return [JSON.stringify(summary), JSON.stringify(violations)];
}
