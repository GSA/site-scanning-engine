import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { ToolingScan } from 'entities/scan-data.entity';

export const buildToolingResult = async (
  logger: Logger,
  page: Page,
): Promise<ToolingScan> => {
  const results = await page.evaluate(() => {
    // Shared indexes, built once
    const linkHrefs = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ).map((el) => el.getAttribute('href')?.toLowerCase() ?? '');

    const scriptSrcs = Array.from(document.querySelectorAll('script')).map(
      (el) => el.getAttribute('src')?.toLowerCase() ?? '',
    );

    const metaGenerators = Array.from(
      document.querySelectorAll('meta[name="generator"]'),
    ).map((el) => el.getAttribute('content')?.toLowerCase() ?? '');

    function getCssFrameworkResults(): string[] {
      const detected: string[] = [];

      if (
        linkHrefs.some((href) => href.includes('bootstrap')) ||
        document.querySelector(
          '.container-fluid, .navbar-toggler, .btn-primary',
        )
      ) {
        detected.push('bootstrap');
      }

      if (
        linkHrefs.some((href) => href.includes('tailwind')) ||
        scriptSrcs.some((src) => src.includes('tailwind'))
      ) {
        detected.push('tailwind');
      }

      if (
        linkHrefs.some((href) => href.includes('foundation')) ||
        document.querySelector('.top-bar, .callout, .orbit-container')
      ) {
        detected.push('foundation');
      }

      if (
        linkHrefs.some((href) => href.includes('bulma')) ||
        document.querySelector(
          '.hero-body, .navbar-burger, .columns.is-multiline',
        )
      ) {
        detected.push('bulma');
      }

      if (
        linkHrefs.some((href) => href.includes('materialize')) ||
        document.querySelector(
          '.materialize-red, .waves-effect, .collection-item',
        )
      ) {
        detected.push('materialize');
      }

      if (
        linkHrefs.some(
          (href) => href.includes('semantic') || href.includes('fomantic'),
        ) ||
        document.querySelector('.ui.button, .ui.menu, .ui.container')
      ) {
        detected.push('semantic-ui');
      }

      if (
        linkHrefs.some((href) => href.includes('uikit')) ||
        document.querySelector('[uk-grid], [uk-slider], [uk-navbar]')
      ) {
        detected.push('uikit');
      }

      if (
        linkHrefs.some(
          (href) => href.includes('material.min') || href.includes('mdl'),
        ) ||
        document.querySelector('.mdl-button, .mdl-layout, .mdl-grid')
      ) {
        detected.push('material-design-lite');
      }

      if (
        linkHrefs.some((href) => href.includes('animate')) ||
        document.querySelector('.animate__animated, .animated')
      ) {
        detected.push('animate.css');
      }

      return detected;
    }

    function getFrontendFrameworkResults(): string[] {
      const detected: string[] = [];

      if (
        (window as any).__NEXT_DATA__ !== undefined ||
        document.querySelector('script#__NEXT_DATA__') ||
        scriptSrcs.some((src) => src.includes('_next/'))
      ) {
        detected.push('next.js');
      }

      if (
        (window as any).__NUXT__ !== undefined ||
        (window as any).__NUXT_ASYNC_DATA__ !== undefined ||
        document.querySelector('#__nuxt, #__layout') ||
        metaGenerators.some((g) => g.includes('nuxt'))
      ) {
        detected.push('nuxt');
      }

      if (
        document.querySelector('[ng-version], [_nghost], [_ngcontent]') ||
        (window as any).ng !== undefined ||
        (document.querySelector('app-root') &&
          document.querySelector('[_nghost], [_ngcontent]'))
      ) {
        detected.push('angular');
      }

      if (
        (window as any).angular !== undefined ||
        document.querySelector('[ng-app], [ng-controller], [ng-model]')
      ) {
        detected.push('angularjs');
      }

      if (
        document.querySelector('[class*="svelte-"]') ||
        (window as any).__SVELTEKIT_DATA__ !== undefined ||
        document.querySelector('script[src*="svelte"]')
      ) {
        detected.push('svelte');
      }

      if (
        document.querySelector('#___gatsby') ||
        scriptSrcs.some((src) => src.includes('gatsby'))
      ) {
        detected.push('gatsby');
      }

      if (
        (window as any).__remixContext !== undefined ||
        document.querySelector('script[src*="remix"]')
      ) {
        detected.push('remix');
      }

      if (
        metaGenerators.some((g) => g.includes('astro')) ||
        document.querySelector('astro-island, astro-slot') ||
        document.querySelector('script[src*="astro"]')
      ) {
        detected.push('astro');
      }

      if (
        (window as any).Ember !== undefined ||
        document.querySelector('.ember-view, .ember-application') ||
        document.querySelector('meta[name="ember-cli"]')
      ) {
        detected.push('ember');
      }

      return detected;
    }

    function getFrontendLibraryResults(): string[] {
      const detected: string[] = [];

      if (
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined ||
        document.querySelector('[data-reactroot], [data-reactid]') ||
        scriptSrcs.some((src) => src.includes('react'))
      ) {
        detected.push('react');
      }

      if (
        (window as any).__VUE__ !== undefined ||
        (window as any).__vue_app__ !== undefined ||
        document.querySelector('[data-v-], #app[data-v-app]') ||
        scriptSrcs.some((src) => src.includes('vue'))
      ) {
        detected.push('vue');
      }

      if (
        (window as any).jQuery !== undefined ||
        ((window as any).$ !== undefined &&
          (window as any).$.fn?.jquery !== undefined)
      ) {
        detected.push('jquery');
      }

      if (
        (window as any).Alpine !== undefined ||
        document.querySelector('[x-data], [x-bind], [x-on]')
      ) {
        detected.push('alpine.js');
      }

      if (
        (window as any).htmx !== undefined ||
        document.querySelector('[hx-get], [hx-post], [hx-swap]')
      ) {
        detected.push('htmx');
      }

      if (
        (window as any).Stimulus !== undefined ||
        document.querySelector('[data-controller]')
      ) {
        detected.push('stimulus');
      }

      if (
        (window as any).__PREACT_DEVTOOLS__ !== undefined ||
        scriptSrcs.some((src) => src.includes('preact'))
      ) {
        detected.push('preact');
      }

      if (
        scriptSrcs.some((src) => /\/solid[-.]|\/solid-js/.test(src)) ||
        ((window as any)._$HY !== undefined &&
          document.querySelector('[data-hk]'))
      ) {
        detected.push('solid');
      }

      if (
        scriptSrcs.some((src) => /\/lit[@/.-]|\/lit\./.test(src)) ||
        document.querySelector('[lit-element]') ||
        (window as any).litElementVersions !== undefined
      ) {
        detected.push('lit');
      }

      if ((window as any).Backbone !== undefined) {
        detected.push('backbone');
      }

      if ((window as any).ko !== undefined) {
        detected.push('knockout');
      }

      if (
        (window as any)._ !== undefined &&
        (window as any)._.VERSION !== undefined
      ) {
        detected.push('lodash');
      }

      if (
        (window as any).gsap !== undefined ||
        (window as any).TweenMax !== undefined ||
        scriptSrcs.some((src) => src.includes('gsap'))
      ) {
        detected.push('gsap');
      }

      if (
        (window as any).THREE !== undefined ||
        scriptSrcs.some((src) => src.includes('three'))
      ) {
        detected.push('three.js');
      }

      if (
        (window as any).d3 !== undefined ||
        scriptSrcs.some((src) => src.includes('d3'))
      ) {
        detected.push('d3');
      }

      return detected;
    }

    function getComponentLibraryResults(): string[] {
      const detected: string[] = [];

      if (
        document.querySelector(
          '.MuiButton-root, .MuiTypography-root, .MuiPaper-root, [class*="MuiBox"]',
        ) ||
        linkHrefs.some((href) => href.includes('mui')) ||
        scriptSrcs.some((src) => src.includes('mui'))
      ) {
        detected.push('mui');
      }

      if (
        document.querySelector(
          '.ant-btn, .ant-layout, .ant-table, .ant-modal',
        ) ||
        linkHrefs.some((href) => href.includes('antd'))
      ) {
        detected.push('ant-design');
      }

      if (
        document.querySelector(
          '.chakra-button, .chakra-modal, [class*="chakra-"]',
        ) ||
        scriptSrcs.some((src) => src.includes('chakra'))
      ) {
        detected.push('chakra-ui');
      }

      if (
        document.querySelector(
          '[data-radix-popper-content-wrapper], [class*="radix-"]',
        ) ||
        scriptSrcs.some((src) => src.includes('radix'))
      ) {
        detected.push('radix-ui');
      }

      if (
        document.querySelector('[data-headlessui-state]') ||
        scriptSrcs.some((src) => src.includes('headlessui'))
      ) {
        detected.push('headless-ui');
      }

      if (
        document.querySelector('.v-application, .v-btn, .v-card') ||
        linkHrefs.some((href) => href.includes('vuetify'))
      ) {
        detected.push('vuetify');
      }

      if (
        document.querySelector('.el-button, .el-table, .el-dialog') ||
        linkHrefs.some(
          (href) =>
            href.includes('element-ui') || href.includes('element-plus'),
        )
      ) {
        detected.push('element-ui');
      }

      if (
        document.querySelector(
          '[class*="p-button"], [class*="p-datatable"], [class*="p-dialog"]',
        ) ||
        linkHrefs.some(
          (href) =>
            href.includes('primevue') ||
            href.includes('primereact') ||
            href.includes('primeng'),
        )
      ) {
        detected.push('primeng');
      }

      if (
        document.querySelector('[class*="mantine-"]') ||
        scriptSrcs.some((src) => src.includes('mantine'))
      ) {
        detected.push('mantine');
      }

      if (
        document.querySelector(
          '.btn.btn-primary.glass, .card.card-body, .drawer',
        ) &&
        (linkHrefs.some((href) => href.includes('daisyui')) ||
          document.querySelector('[data-theme]'))
      ) {
        detected.push('daisyui');
      }

      if (
        document.querySelector('[data-flowbite]') ||
        scriptSrcs.some((src) => src.includes('flowbite'))
      ) {
        detected.push('flowbite');
      }

      if (
        document.querySelector('[class*="nextui-"]') ||
        scriptSrcs.some((src) => src.includes('nextui'))
      ) {
        detected.push('nextui');
      }

      return detected;
    }

    return [
      ...getCssFrameworkResults(),
      ...getFrontendFrameworkResults(),
      ...getFrontendLibraryResults(),
      ...getComponentLibraryResults(),
    ];
  });

  return {
    tooling: results.length ? results.sort().join(',') : null,
  };
};
