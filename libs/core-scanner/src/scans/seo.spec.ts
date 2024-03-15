import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPResponse } from 'puppeteer';
import { browserInstance, newTestPage } from '../test-helper';
import { buildSeoResult } from './seo';

describe('seo scan', () => {
  it('works', async () => {
    await newTestPage(async ({ page }) => {
      const result = await buildSeoResult(
        mock<Logger>(),
        page,
        mock<HTTPResponse>(),
      );
      expect(result).toEqual({
        mainElementFinalUrl: true,
        ogArticlePublishedFinalUrl: undefined,
        ogArticleModifiedFinalUrl: new Date('2022-01-27T22:26:31.000Z'),
        ogDescriptionFinalUrl:
          'Appalachian Regional Commission The Appalachian Regional Commission (ARC) is an economic development partnership agency of the federal government and 13 state governments focusing on 423 counties across the Appalachian Region. ARC’s mission is to innovate, partner, and invest to build community capacity and strengthen economic growth in Appalachia. Research and Resources Available Opportunities In The […]',
        ogTitleFinalUrl:
          "Investing in Appalachia's economic future. - Appalachian Regional Commission",
        canonicalLink: 'https://www.arc.gov/',
        pageTitle:
          "Investing in Appalachia's economic future. - Appalachian Regional Commission",
        metaDescriptionContent: '',

        hreflangCodes: '',
        // #852 Begin March 2024 experimental fields
        contextContent: null,
        dateContent: null,
        dcDateContent: null,
        dcDateCreatedContent: null,
        dcSubjectContent: null,
        dcTitleContent: null,
        dcTypeContent: null,
        dctermsAudienceContent: null,
        dctermsCreatedContent: null,
        dctermsKeywordsContent: null,
        dctermsSubjectContent: null,
        dctermsTypeContent: null,
        hrefLangContent: '',
        htmlLangContent: 'en-US',
        itemPropContent: null,
        itemScopeContent: null,
        itemTypeContent: null,
        languageContent: null,
        lastModifiedContent: null,
        meContent: null,
        metaArticleSectionContent: null,
        metaArticleTagContent: null,
        metaKeywordsContent: null,
        metaRobotsContent:
          'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        ogImageAltContent: null,
        ogImageFinalUrl:
          'https://www.arc.gov/wp-content/uploads/2020/08/48982308566_5ce274f0ab_o-washington-scaled.jpg',
        ogLocaleContent: 'en_US',
        ogSiteName: null,
        ogSiteNameContent: 'Appalachian Regional Commission',
        ogTypeContent: 'website',
        ogUrlContent: 'https://www.arc.gov/',
        ownerContent: null,
        pagenameContent: null,
        propertyContent: 'og:locale',
        revisedContent: null,
        subjectContent: null,
        typeContent:
          'text/css,application/rss+xml,application/json,application/rsd+xml,application/wlwmanifest+xml,application/json+oembed,text/xml+oembed',
        typeOfContent: null,
        vocabContent: null,
        // End March 2024 experimental fields
      });
    }, 'arc_gov_dump.mht');
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
