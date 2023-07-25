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
          const actionAttribute = el.getAttribute('action');
          if (
            actionAttribute &&
            actionAttribute.toLowerCase().includes('search')
          ) {
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
          const typeAttribute = el.getAttribute('type');
          if (typeAttribute && typeAttribute.toLowerCase().includes('search')) {
            result = true;
          }
        });
      }

      return result;
    };

    const hasSearchInIdNameOrClass = (formElements: HTMLElement[]): boolean => {
      let result = false;

      if (formElements.length > 0) {
        formElements.forEach((el) => {
          const nameAttribute = el.getAttribute('name');
          const idAttribute = el.getAttribute('id');
          if (
            (nameAttribute && nameAttribute.toLowerCase().includes('search')) ||
            (idAttribute && idAttribute.toLowerCase().includes('search')) ||
            el.classList.contains('search')
          ) {
            result = true;
          }
        });
      }

      return result;
    };

    return (
      hasSearchInFormAction(formElements) ||
      hasUswdsSearchComponent(formElements) ||
      hasSearchInInputType(inputElements) ||
      hasSearchInIdNameOrClass(formElements) ||
      hasSearchInIdNameOrClass(inputElements)
    );
  });

  return { searchDetected };
};
