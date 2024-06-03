import * as _ from 'lodash';
import { HTTPResponse } from 'puppeteer';

import { CmsScan } from 'entities/scan-data.entity';

export const buildCmsResult = async (
  mainResponse: HTTPResponse,
): Promise<CmsScan> => {
  const htmlMatches = await getHtmlMatches(mainResponse);
  const headerMatches = await getHeaderMatches(mainResponse);

  let cms = null;

  if (htmlMatches.length > 0) {
    cms = htmlMatches[0].cms;
  } else if (headerMatches.length > 0) {
    cms = headerMatches[0].cms;
  }

  return { cms };
};

const getHtmlMatches = async (response: HTTPResponse) => {
  const actualHtml = await response.text();

  return cmsData.filter((obj) => {
    if (obj.html) {
      if (Array.isArray(obj.html)) {
        return (
          obj.html.filter((html) => {
            if (actualHtml.match(new RegExp(html, 'i'))) {
              return obj;
            }
          }).length > 0
        );
      } else {
        if (actualHtml.match(new RegExp(obj.html, 'i'))) {
          return obj;
        }
      }
    }
  });
};

const getHeaderMatches = async (response: HTTPResponse) => {
  const actualHeaders = await response.headers();
  const formattedActualHeaders = _.transform(
    actualHeaders,
    function (result, val, key) {
      result[key.toLowerCase()] = val.toLowerCase();
    },
  );

  return cmsData.filter((obj) => {
    if (obj.headers) {
      return obj.headers.some((header) => {
        const formattedKey = header.key.toLowerCase();
        if (Object.keys(formattedActualHeaders).includes(formattedKey)) {
          const formattedValue = formattedActualHeaders[formattedKey];
          if (
            formattedValue.match(new RegExp(header.value, 'i')) ||
            header.value === ''
          ) {
            return header;
          }
        }
      });
    }
  });
};

const cmsData = [
  {
    cms: 'Adobe Experience Manager',
    html: [
      'class="[^"]*parbase',
      '<div[^>]+data-component-path="[^"+]jcr:',
      'class="[^"]*aem-Grid',
      'href="[^"]*clientlib[^"]*"',
      'class="[^"]*cmp-name[^"]*"',
      'data-wcm-mode',
    ],
    headers: [
      { key: 'Dispatcher', value: '' },
      { key: 'CQ-Action', value: '' },
      { key: 'CQ-Handle', value: '' },
    ],
  },
  {
    cms: 'Bloomreach',
    html: '<[^>]+/binaries/(?:[^/]+/)*content/gallery/',
  },
  {
    cms: 'BoldGrid',
    html: [
      `<link rel=["']stylesheet["'] [^>]+boldgrid`,
      `<link rel=["']stylesheet["'] [^>]+post-and-page-builder`,
      '<link[^>]+s\\d+\\.boldgrid\\.com',
    ],
  },
  { cms: 'Business Catalyst', html: '<!-- BC_OBNW -->' },
  {
    cms: 'Contentful',
    html: '<[^>]+(?:https?:)?//(?:assets|downloads|images|videos)\\.(?:ct?fassets\\.net|contentful\\.com)',
    headers: [{ key: 'x-contentful-request-id', value: '' }],
  },
  {
    cms: 'cloud.gov Pages',
    headers: [{ key: 'x-server', value: 'cloud.gov pages' }],
  },
  {
    cms: 'DNN',
    html: [
      '<!-- by DotNetNuke Corporation',
      '<!-- DNN Platform',
      '<meta[^>]*content="[^"]*DotNetNuke[^"]*"[^>]*>',
      'class="[^"]*DnnModule[^"]*"',
    ],
    headers: [
      { key: 'Cookie', value: 'dnn_IsMobile=' },
      { key: 'DNNOutputCache', value: '' },
      { key: 'X-Compressed-By', value: 'DotNetNuke' },
    ],
  },
  {
    cms: 'Drupal',
    html: [
      '<(?:link|style)[^>]+"/sites/(?:default|all)/(?:themes|modules)/',
      '<meta[^>]*name="Generator"[^>]*content="[^"]*drupal[^"]*"[^>]*>',
    ],
    headers: [
      { key: 'X-Drupal-Cache', value: '' },
      { key: 'X-Generator', value: '^Drupal(?:\\s([\\d.]+))?\\;version:\\1' },
    ],
  },
  { cms: 'FaraPy', html: '<!-- Powered by FaraPy.' },
  {
    cms: 'FlexCMP',
    html: '<!--[^>]+FlexCMP[^>v]+v\\. ([\\d.]+)\\;version:\\1',
    headers: [
      { key: 'X-Flex-Lang', value: '' },
      {
        key: 'X-Powered-By',
        value: 'FlexCMP.+\\[v\\. ([\\d.]+)\\;version:\\1',
      },
    ],
  },
  {
    cms: 'GX WebManager',
    html: '<!--\\s+Powered by GX',
  },
  {
    cms: 'Green Valley CMS',
    html: '<img[^>]+/dsresource\\?objectid=',
  },
  { cms: 'Indexhibit', html: '<(?:link|a href) [^>]+ndxz-studio' },
  {
    cms: 'Indico',
    html: 'Powered by\\s+(?:CERN )?<a href="http://(?:cdsware\\.cern\\.ch/indico/|indico-software\\.org|cern\\.ch/indico)">(?:CDS )?Indico( [\\d\\.]+)?\\;version:\\1',
  },
  {
    cms: 'Jahia DX',
    html: '<script id="staticAssetAggregatedJavascrip',
  },
  {
    cms: 'Joomla',
    html: [
      '(?:<div[^>]+id="wrapper_r"|<(?:link|script)[^>]+(?:feed|components)/com_|<table[^>]+class="pill)\\;confidence:50',
      '<meta +[^>]*content=["\'][^"\']*Joomla[^"\']*["\'][^>]*>',
      '<meta[^>]*name="Generator"[^>]*content="[^"]*Joomla[^"]*"[^>]*>',
    ],
    headers: [
      { key: 'X-Content-Encoded-By', value: 'Joomla! ([\\d.]+)\\;version:\\1' },
    ],
  },
  {
    cms: 'Koala Framework',
    html: '<!--[^>]+This website is powered by Koala Web Framework CMS',
  },
  {
    cms: 'Koken',
    html: [
      '<html lang="en" class="k-source-essays k-lens-essays">',
      '<!--\\s+KOKEN DEBUGGING',
    ],
  },
  {
    cms: 'Koobi',
    html: '<!--[^K>-]+Koobi ([a-z\\d.]+)\\;version:\\1',
  },
  { cms: 'Lede', html: ['<a [^>]*href="[^"]+joinlede.com'] },
  {
    cms: 'LightMon Engine',
    html: '<!-- Lightmon Engine Copyright Lightmon',
  },
  { cms: 'Lithium', html: ' <a [^>]+Powered by Lithium' },
  {
    cms: 'LocomotiveCMS',
    html: '<link[^>]*/sites/[a-z\\d]{24}/theme/stylesheets',
  },
  {
    cms: 'MODX',
    html: [
      '<a[^>]+>Powered by MODX</a>',
      '<!-- Modx process time debug info -->',
      '<(?:link|script)[^>]+assets/snippets/\\;confidence:20',
      '<form[^>]+id="ajaxSearch_form\\;confidence:20',
      '<input[^>]+id="ajaxSearch_input\\;confidence:20',
    ],
    headers: [{ key: 'X-Powered-By', value: '^MODX' }],
  },
  {
    cms: 'Melis Platform',
    html: [
      '<!-- Rendered with Melis CMS V2',
      '<!-- Rendered with Melis Platform',
    ],
  },
  { cms: 'Methode', html: '<!-- Methode uuid: "[a-f\\d]+" ?-->' },
  {
    cms: 'Microsoft Sharepoint',
    html: [
      '<meta[^>]*name="Generator"[^>]*content="[^"]*sharepoint[^"]*"[^>]*>',
    ],
    headers: [
      { key: 'MicrosoftSharePointTeamServices', value: '^(.+)$\\;version:\\1' },
      { key: 'SPRequestGuid', value: '' },
      { key: 'SharePointHealthScore', value: '' },
      { key: 'X-SharePointHealthScore', value: '' },
    ],
  },
  {
    cms: 'Moguta.CMS',
    html: `<link[^>]+href=["'][^"]+mg-(?:core|plugins|templates)/`,
  },
  {
    cms: 'MotoCMS',
    html: '<link [^>]*href="[^>]*\\/mt-content\\/[^>]*\\.css',
  },
  {
    cms: 'Odoo',
    html: '<link[^>]* href=[^>]+/web/css/(?:web\\.assets_common/|website\\.assets_frontend/)\\;confidence:25',
  },
  {
    cms: 'OpenCms',
    html: '<link href="/opencms/',
    headers: [{ key: 'Server', value: 'OpenCms' }],
  },
  {
    cms: 'OpenText Web Solutions',
    html: '<!--[^>]+published by Open Text Web Solutions',
  },
  { cms: 'PHP-Nuke', html: '<[^>]+Powered by PHP-Nuke' },
  {
    cms: 'PHPFusion',
    html: [
      'Powered by <a href="[^>]+phpfusion',
      'Powered by <a href="[^>]+php-fusion',
    ],
    headers: [
      { key: 'X-PHPFusion', value: '(.+)$\\;version:\\1' },
      { key: 'X-Powered-By', value: 'PHPFusion (.+)$\\;version:\\1' },
    ],
  },
  {
    cms: 'Percussion',
    html: [
      '<[^>]+class="perc-region"',
      '<meta +[^>]*content=["\'][^"\']*Percussion[^"\']*["\'][^>]*>',
      '<meta +[^>]*content=["\'][^"\']*Rhythmyx[^"\']*["\'][^>]*>',
    ],
  },
  { cms: 'Pligg', html: '<span[^>]+id="xvotes-0' },
  { cms: 'Posterous', html: '<div class="posterous' },
  {
    cms: 'Proximis Unified Commerce',
    html: '<html[^>]+data-ng-app="RbsChangeApp"',
  },
  {
    cms: 'Quick.CMS',
    html: '<a href="[^>]+opensolution\\.org/">CMS by',
  },
  { cms: 'RBS Change', html: '<html[^>]+xmlns:change=' },
  {
    cms: 'RebelMouse',
    html: '<!-- Powered by RebelMouse\\.',
    headers: [
      { key: 'x-rebelmouse-cache-control', value: '' },
      { key: 'x-rebelmouse-surrogate-control', value: '' },
    ],
  },
  { cms: 'Scorpion', html: '<[^>]+id="HSScorpion' },
  { cms: 'SDL Tridion', html: '<img[^>]+_tcm\\d{2,3}-\\d{6}\\.' },
  {
    cms: 'SilverStripe',
    html: [
      'Powered by <a href="[^>]+SilverStripe',
      '<meta +[^>]*content=["\'][^"\']*SilverStripe[^"\']*["\'][^>]*>',
    ],
  },
  { cms: 'SmartSite', html: '<[^>]+/smartsite\\.(?:dws|shtml)\\?id=' },
  {
    cms: 'Smartstore Page Builder',
    html: '<section[^>]+class="g-stage',
  },
  {
    cms: 'Solodev',
    html: `<div class=["']dynamicDiv["'] id=["']dd\\.\\d\\.\\d(?:\\.\\d)?["']>`,
    headers: [{ key: 'solodev_session', value: '' }],
  },
  {
    cms: 'Squiz Matrix',
    html: '<!--\\s+Running (?:MySource|Squiz) Matrix',
    headers: [{ key: 'X-Powered-By', value: 'Squiz Matrix' }],
  },
  { cms: 'Strikingly', html: '<!-- Powered by Strikingly\\.com' },
  {
    cms: 'TYPO3 CMS',
    html: [
      '<link[^>]+ href="/?typo3(?:conf|temp)/',
      '<img[^>]+ src="/?typo3(?:conf|temp)/',
      '<!--\n\tThis website is powered by TYPO3',
    ],
  },
  {
    cms: 'Thelia',
    html: '<(?:link|style|script)[^>]+/assets/frontOffice/',
  },
  {
    cms: 'TiddlyWiki',
    html: '<[^>]*type=[^>]text\\/vnd\\.tiddlywiki',
  },
  {
    cms: 'Tilda',
    html: '<link[^>]* href=[^>]+tilda(?:cdn|\\.ws|-blocks)',
  },
  {
    cms: 'Vigbo',
    html: '<link[^>]* href=[^>]+(?:\\.vigbo\\.com|\\.gophotoweb\\.com)',
  },
  { cms: 'Vignette', html: '<[^>]+="vgn-?ext' },
  {
    cms: 'Voog.com Website Builder',
    html: '<script [^>]*src="[^"]*voog\\.com/tracker\\.js',
  },
  {
    cms: 'Wolf CMS',
    html: '(?:<a href="[^>]+wolfcms\\.org[^>]+>Wolf CMS(?:</a>)? inside|Thank you for using <a[^>]+>Wolf CMS)',
  },
  {
    cms: 'WordPress',
    html: [
      `<link rel=["']stylesheet["'] [^>]+/wp-(?:content|includes)/`,
      '<link[^>]+s\\d+\\.wp\\.com',
    ],
    headers: [
      { key: 'X-Pingback', value: '/xmlrpc\\.php$' },
      { key: 'link', value: 'rel="https://api\\.w\\.org/"' },
    ],
  },
  {
    cms: 'imperia CMS',
    html: '<imp:live-info sysid="[0-9a-f-]+"(?: node_id="[0-9/]*")? *\\/>',
  },
  { cms: 'papaya CMS', html: '<link[^>]*/papaya-themes/' },
  {
    cms: 'phpwind',
    html: '(?:Powered|Code) by <a href="[^"]+phpwind\\.net',
  },
  {
    cms: 'pirobase CMS',
    html: [
      '<(?:script|link)[^>]/site/[a-z0-9/._-]+/resourceCached/[a-z0-9/._-]+',
      '<input[^>]+cbi:///cms/',
    ],
  },
  {
    cms: 'uKnowva',
    html: '<a[^>]+>Powered by uKnowva</a>',
    headers: [
      { key: 'X-Content-Encoded-By', value: 'uKnowva ([\\d.]+)\\;version:\\1' },
    ],
  },
];
