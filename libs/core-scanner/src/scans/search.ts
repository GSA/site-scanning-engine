import { Page } from 'puppeteer';

import { SearchScan } from 'entities/scan-data.entity';

export const buildSearchResult = async (page: Page): Promise<SearchScan> => {
  const searchDetected = await page.evaluate(() => {
    const formElements = [...document.querySelectorAll('form')];
    const inputElements = [...document.querySelectorAll('input')];

    const hasSearchInFormAction = (
      formElements: HTMLFormElement[],
    ): boolean => {
      let result = false;

      if (formElements.length > 0) {
        formElements.forEach((el) => {
          const actionAttribute = el.getAttribute('action').toLowerCase();
          if (actionAttribute && actionAttribute.includes('search')) {
            result = true;
          }
        });
      }

      return result;
    };

    const hasUswdsSearchComponent = (
      formElements: HTMLFormElement[],
    ): boolean => {
      let result = false;

      if (formElements.length > 0) {
        formElements.forEach((el) => {
          if (el.classList.contains('usa-search')) {
            result = true;
          }
        });
      }

      return result;
    };

    const hasSearchInInputType = (
      inputElements: HTMLInputElement[],
    ): boolean => {
      let result = false;

      if (inputElements.length > 0) {
        inputElements.forEach((el) => {
          const typeAttribute = el.getAttribute('type').toLowerCase();
          if (typeAttribute && typeAttribute.includes('search')) {
            result = true;
          }
        });
      }

      return result;
    };

    return (
      hasSearchInFormAction(formElements) ||
      hasUswdsSearchComponent(formElements) ||
      hasSearchInInputType(inputElements)
    );
  });

  return { searchDetected };
};
