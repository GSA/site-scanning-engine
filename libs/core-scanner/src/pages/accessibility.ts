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

    const { violationsSummary, violationsList } =
      aggregateViolations(violations);

    const accessibilityViolations = Object.keys(violationsSummary).length
      ? JSON.stringify(violationsSummary)
      : null;
    const accessibilityViolationsList = violationsList.length
      ? JSON.stringify(violationsList)
      : null;

    return {
      accessibilityViolations,
      accessibilityViolationsList,
    };
  };
};

type AggregatedViolations = {
  violationsSummary: Record<string, number>;
  violationsList: Result[];
};

function aggregateViolations(violations: Result[]): AggregatedViolations {
  const violationsSummary = {};
  const violationsList = [];

  // Mapping of a11y violation categories to axe-core Result id values
  const violationCategoryMapping = {
    aria: [
      'aria-allowed-attr',
      'aria-deprecated-role',
      'aria-hidden-body',
      'aria-hidden-focus',
      'aria-prohibited-attr',
      'aria-required-attr',
      'aria-required-children',
      'aria-required-parent',
      'aria-roles',
      'aria-tooltip-name',
      'aria-valid-attr-value',
      'aria-valid-attr',
    ],
    'auto-updating': ['meta-refresh'],
    contrast: ['color-contrast'],
    flash: ['blink', 'marquee'],
    'form-names': ['aria-input-field-name', 'input-field-name', 'select-name'],
    'frames-iframes': ['frame-title'],
    images: [
      'area-alt',
      'image-alt',
      'input-image-alt',
      'object-alt',
      'role-img-alt',
      'svg-img-alt',
    ],
    'keyboard-access': [
      'frame-focusable-content',
      'scrollable-region-focusable',
    ],
    language: ['html-lang-valid', 'valid-lang', 'html-has-lang'],
    'link-purpose': ['link-name'],
    lists: ['definition-list', 'dlitem', 'list', 'listitem'],
    'page-titled': ['document-title'],
    tables: ['td-headers-attr', 'th-has-data-cells'],
    'user-control-name': [
      'aria-command-name',
      'aria-meter-name',
      'aria-progressbar-name',
      'aria-toggle-field-name',
      'button-name',
    ],
  };

  violations.forEach((violation) => {
    for (const categorys in violationCategoryMapping) {
      if (violationCategoryMapping[categorys].includes(violation.id)) {
        violationsSummary[categorys] = violationsSummary[categorys]
          ? violationsSummary[categorys] + 1
          : 1;
        violationsList.push(violation);
        break;
      }
    }
  });

  return {
    violationsSummary,
    violationsList,
  };
}
