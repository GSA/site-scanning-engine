import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { ToolingScan } from 'entities/scan-data.entity';

export const buildToolingResult = async (
  logger: Logger,
  page: Page,
): Promise<ToolingScan> => {
  const cssLibraryResults = await getCssLibraryResults(page);

  return {
    tooling: cssLibraryResults.length ? cssLibraryResults : null,
  };
};

async function getCssLibraryResults(page: Page): Promise<string> {
  const result = await page.evaluate(() => {
    const detected: string[] = [];

    const linkHrefs = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ).map((el) => el.getAttribute('href')?.toLowerCase() ?? '');

    const scriptSrcs = Array.from(document.querySelectorAll('script')).map(
      (el) => el.getAttribute('src')?.toLowerCase() ?? '',
    );

    // Bootstrap
    if (
      linkHrefs.some((href) => href.includes('bootstrap')) ||
      document.querySelector('.container-fluid, .navbar-toggler, .btn-primary')
    ) {
      detected.push('bootstrap');
    }

    // Tailwind
    if (
      linkHrefs.some((href) => href.includes('tailwind')) ||
      scriptSrcs.some((src) => src.includes('tailwind'))
    ) {
      detected.push('tailwind');
    }

    // Foundation
    if (
      linkHrefs.some((href) => href.includes('foundation')) ||
      document.querySelector('.top-bar, .callout, .orbit-container')
    ) {
      detected.push('foundation');
    }

    // Animate.css
    if (
      linkHrefs.some((href) => href.includes('animate')) ||
      document.querySelector('.animate__animated, .animated')
    ) {
      detected.push('animate.css');
    }

    // Bulma
    if (
      linkHrefs.some((href) => href.includes('bulma')) ||
      document.querySelector('.hero-body, .navbar-burger, .is-primary')
    ) {
      detected.push('bulma');
    }

    // Materialize
    if (
      linkHrefs.some((href) => href.includes('materialize')) ||
      document.querySelector(
        '.materialize-red, .waves-effect, .collection-item',
      )
    ) {
      detected.push('materialize');
    }

    // Semantic UI
    if (
      linkHrefs.some((href) => href.includes('semantic')) ||
      document.querySelector('.ui.button, .ui.menu, .ui.container')
    ) {
      detected.push('semantic-ui');
    }

    // UIkit
    if (
      linkHrefs.some((href) => href.includes('uikit')) ||
      document.querySelector('[uk-grid], [uk-slider], [uk-navbar]')
    ) {
      detected.push('uikit');
    }

    // Material Design Lite
    if (
      linkHrefs.some(
        (href) => href.includes('material.min') || href.includes('mdl'),
      ) ||
      document.querySelector('.mdl-button, .mdl-layout, .mdl-grid')
    ) {
      detected.push('material-design-lite');
    }

    return detected;
  });

  return result.join(',');
}
