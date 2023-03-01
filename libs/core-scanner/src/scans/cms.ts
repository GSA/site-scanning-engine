import { HTTPResponse } from 'puppeteer';

import { CmsScan } from 'entities/scan-data.entity';

export const buildCmsResult = async (
  mainResponse: HTTPResponse,
): Promise<CmsScan> => {
  const html = await mainResponse.text();
  const result = cmsRegex.filter((obj) => {
    if (Array.isArray(obj.regex)) {
      return (
        obj.regex.filter((regex) => {
          if (html.match(new RegExp(regex))) {
            return obj;
          }
        }).length > 0
      );
    } else {
      if (html.match(new RegExp(obj.regex))) {
        return obj;
      }
    }
  });

  return { cms: result.length > 0 ? result[0].cms : null };
};

const cmsRegex = [
  {
    cms: 'Adobe Experience Manager',
    regex: [
      '<div class="[^"]*parbase',
      '<div[^>]+data-component-path="[^"+]jcr:',
      '<div class="[^"]*aem-Grid',
    ],
  },
  {
    cms: 'Bloomreach',
    regex: '<[^>]+/binaries/(?:[^/]+/)*content/gallery/',
  },
  {
    cms: 'BoldGrid',
    regex: [
      `<link rel=["']stylesheet["'] [^>]+boldgrid`,
      `<link rel=["']stylesheet["'] [^>]+post-and-page-builder`,
      '<link[^>]+s\\d+\\.boldgrid\\.com',
    ],
  },
  { cms: 'Business Catalyst', regex: '<!-- BC_OBNW -->' },
  {
    cms: 'Contentful',
    regex:
      '<[^>]+(?:https?:)?//(?:assets|downloads|images|videos)\\.(?:ct?fassets\\.net|contentful\\.com)',
  },
  {
    cms: 'DNN',
    regex: ['<!-- by DotNetNuke Corporation', '<!-- DNN Platform'],
  },
  {
    cms: 'Drupal',
    regex: '<(?:link|style)[^>]+"/sites/(?:default|all)/(?:themes|modules)/',
  },
  { cms: 'FaraPy', regex: '<!-- Powered by FaraPy.' },
  {
    cms: 'FlexCMP',
    regex: '<!--[^>]+FlexCMP[^>v]+v\\. ([\\d.]+)\\;version:\\1',
  },
  { cms: 'GX WebManager', regex: '<!--\\s+Powered by GX' },
  {
    cms: 'Green Valley CMS',
    regex: '<img[^>]+/dsresource\\?objectid=',
  },
  { cms: 'Indexhibit', regex: '<(?:link|a href) [^>]+ndxz-studio' },
  {
    cms: 'Indico',
    regex:
      'Powered by\\s+(?:CERN )?<a href="http://(?:cdsware\\.cern\\.ch/indico/|indico-software\\.org|cern\\.ch/indico)">(?:CDS )?Indico( [\\d\\.]+)?\\;version:\\1',
  },
  {
    cms: 'Jahia DX',
    regex: '<script id="staticAssetAggregatedJavascrip',
  },
  {
    cms: 'Joomla',
    regex:
      '(?:<div[^>]+id="wrapper_r"|<(?:link|script)[^>]+(?:feed|components)/com_|<table[^>]+class="pill)\\;confidence:50',
  },
  {
    cms: 'Koala Framework',
    regex: '<!--[^>]+This website is powered by Koala Web Framework CMS',
  },
  {
    cms: 'Koken',
    regex: [
      '<html lang="en" class="k-source-essays k-lens-essays">',
      '<!--\\s+KOKEN DEBUGGING',
    ],
  },
  {
    cms: 'Koobi',
    regex: '<!--[^K>-]+Koobi ([a-z\\d.]+)\\;version:\\1',
  },
  { cms: 'Lede', regex: ['<a [^>]*href="[^"]+joinlede.com'] },
  {
    cms: 'LightMon Engine',
    regex: '<!-- Lightmon Engine Copyright Lightmon',
  },
  { cms: 'Lithium', regex: ' <a [^>]+Powered by Lithium' },
  {
    cms: 'LocomotiveCMS',
    regex: '<link[^>]*/sites/[a-z\\d]{24}/theme/stylesheets',
  },
  {
    cms: 'MODX',
    regex: [
      '<a[^>]+>Powered by MODX</a>',
      '<!-- Modx process time debug info -->',
      '<(?:link|script)[^>]+assets/snippets/\\;confidence:20',
      '<form[^>]+id="ajaxSearch_form\\;confidence:20',
      '<input[^>]+id="ajaxSearch_input\\;confidence:20',
    ],
  },
  {
    cms: 'Melis Platform',
    regex: [
      '<!-- Rendered with Melis CMS V2',
      '<!-- Rendered with Melis Platform',
    ],
  },
  { cms: 'Methode', regex: '<!-- Methode uuid: "[a-f\\d]+" ?-->' },
  {
    cms: 'Moguta.CMS',
    regex: `<link[^>]+href=["'][^"]+mg-(?:core|plugins|templates)/`,
  },
  {
    cms: 'MotoCMS',
    regex: '<link [^>]*href="[^>]*\\/mt-content\\/[^>]*\\.css',
  },
  {
    cms: 'Odoo',
    regex:
      '<link[^>]* href=[^>]+/web/css/(?:web\\.assets_common/|website\\.assets_frontend/)\\;confidence:25',
  },
  { cms: 'OpenCms', regex: '<link href="/opencms/' },
  {
    cms: 'OpenText Web Solutions',
    regex: '<!--[^>]+published by Open Text Web Solutions',
  },
  { cms: 'PHP-Nuke', regex: '<[^>]+Powered by PHP-Nuke' },
  {
    cms: 'PHPFusion',
    regex: [
      'Powered by <a href="[^>]+phpfusion',
      'Powered by <a href="[^>]+php-fusion',
    ],
  },
  { cms: 'Percussion', regex: '<[^>]+class="perc-region"' },
  { cms: 'Pligg', regex: '<span[^>]+id="xvotes-0' },
  { cms: 'Posterous', regex: '<div class="posterous' },
  {
    cms: 'Proximis Unified Commerce',
    regex: '<html[^>]+data-ng-app="RbsChangeApp"',
  },
  {
    cms: 'Quick.CMS',
    regex: '<a href="[^>]+opensolution\\.org/">CMS by',
  },
  { cms: 'RBS Change', regex: '<html[^>]+xmlns:change=' },
  { cms: 'RebelMouse', regex: '<!-- Powered by RebelMouse\\.' },
  { cms: 'SDL Tridion', regex: '<img[^>]+_tcm\\d{2,3}-\\d{6}\\.' },
  { cms: 'Scorpion', regex: '<[^>]+id="HSScorpion' },
  {
    cms: 'SilverStripe',
    regex: 'Powered by <a href="[^>]+SilverStripe',
  },
  { cms: 'SmartSite', regex: '<[^>]+/smartsite\\.(?:dws|shtml)\\?id=' },
  {
    cms: 'Smartstore Page Builder',
    regex: '<section[^>]+class="g-stage',
  },
  {
    cms: 'Solodev',
    regex: `<div class=["']dynamicDiv["'] id=["']dd\\.\\d\\.\\d(?:\\.\\d)?["']>`,
  },
  {
    cms: 'Squiz Matrix',
    regex: '<!--\\s+Running (?:MySource|Squiz) Matrix',
  },
  { cms: 'Strikingly', regex: '<!-- Powered by Strikingly\\.com' },
  {
    cms: 'TYPO3 CMS',
    regex: [
      '<link[^>]+ href="/?typo3(?:conf|temp)/',
      '<img[^>]+ src="/?typo3(?:conf|temp)/',
      '<!--\n\tThis website is powered by TYPO3',
    ],
  },
  {
    cms: 'Thelia',
    regex: '<(?:link|style|script)[^>]+/assets/frontOffice/',
  },
  {
    cms: 'TiddlyWiki',
    regex: '<[^>]*type=[^>]text\\/vnd\\.tiddlywiki',
  },
  {
    cms: 'Tilda',
    regex: '<link[^>]* href=[^>]+tilda(?:cdn|\\.ws|-blocks)',
  },
  {
    cms: 'Vigbo',
    regex: '<link[^>]* href=[^>]+(?:\\.vigbo\\.com|\\.gophotoweb\\.com)',
  },
  { cms: 'Vignette', regex: '<[^>]+="vgn-?ext' },
  {
    cms: 'Voog.com Website Builder',
    regex: '<script [^>]*src="[^"]*voog\\.com/tracker\\.js',
  },
  {
    cms: 'Wolf CMS',
    regex:
      '(?:<a href="[^>]+wolfcms\\.org[^>]+>Wolf CMS(?:</a>)? inside|Thank you for using <a[^>]+>Wolf CMS)',
  },
  {
    cms: 'WordPress',
    regex: [
      `<link rel=["']stylesheet["'] [^>]+/wp-(?:content|includes)/`,
      '<link[^>]+s\\d+\\.wp\\.com',
    ],
  },
  {
    cms: 'imperia CMS',
    regex: '<imp:live-info sysid="[0-9a-f-]+"(?: node_id="[0-9/]*")? *\\/>',
  },
  { cms: 'papaya CMS', regex: '<link[^>]*/papaya-themes/' },
  {
    cms: 'phpwind',
    regex: '(?:Powered|Code) by <a href="[^"]+phpwind\\.net',
  },
  {
    cms: 'pirobase CMS',
    regex: [
      '<(?:script|link)[^>]/site/[a-z0-9/._-]+/resourceCached/[a-z0-9/._-]+',
      '<input[^>]+cbi:///cms/',
    ],
  },
  { cms: 'uKnowva', regex: '<a[^>]+>Powered by uKnowva</a>' },
];
