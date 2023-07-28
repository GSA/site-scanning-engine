import { Page } from 'puppeteer';

import { SearchScan } from 'entities/scan-data.entity';

export const buildSearchResult = async (page: Page): Promise<SearchScan> => {
  const searchScanResults = await page.evaluate(() => {
    const formElements = [...document.querySelectorAll('form')];
    const inputElements = [...document.querySelectorAll('input')];

    const searchElements =
      (criteriaFn: (el: HTMLElement) => boolean) =>
      (elements: HTMLElement[]): boolean => {
        let result = false;

        if (elements.length > 0) {
          elements.forEach((el) => {
            if (criteriaFn(el)) {
              result = true;
            }
          });
        }

        return result;
      };

    const hasSearchInFormAction = searchElements((el: HTMLElement) => {
      const actionAttribute = el.getAttribute('action');
      return (
        actionAttribute && actionAttribute.toLowerCase().includes('search')
      );
    });

    const hasUswdsSearchComponent = searchElements((el: HTMLElement) => {
      return el.classList.contains('usa-search');
    });

    const hasSearchInInputType = searchElements((el: HTMLElement) => {
      const typeAttribute = el.getAttribute('type');
      return typeAttribute && typeAttribute.toLowerCase().includes('search');
    });

    const hasSearchInIdNameOrClass = searchElements((el: HTMLElement) => {
      const nameAttribute = el.getAttribute('name');
      const idAttribute = el.getAttribute('id');
      return (
        (nameAttribute && nameAttribute.toLowerCase().includes('search')) ||
        (idAttribute && idAttribute.toLowerCase().includes('search')) ||
        el.classList.contains('search')
      );
    });

    const usesSearchGov = searchElements((el: HTMLElement) => {
      const actionAttribute = el.getAttribute('action');
      return (
        actionAttribute &&
        actionAttribute.toLowerCase().includes('https://search.usa.gov/search')
      );
    });

    return {
      searchDetected:
        hasSearchInFormAction(formElements) ||
        hasUswdsSearchComponent(formElements) ||
        hasSearchInInputType(inputElements) ||
        hasSearchInIdNameOrClass(formElements) ||
        hasSearchInIdNameOrClass(inputElements),
      searchgov: usesSearchGov(formElements) ?? null,
    };
  });

  return searchScanResults;
};
