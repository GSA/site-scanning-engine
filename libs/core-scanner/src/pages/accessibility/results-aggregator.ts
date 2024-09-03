import {
  Result,
  NodeResult,
  CheckResult,
  TagValue,
  UnlabelledFrameSelector,
  RelatedNode,
} from 'axe-core';

type ResultSubset = {
  description: string;
  helpUrl: string;
  id: string;
  tags: TagValue[];
  nodes: NodeResultSubset[];
  scanDate: string;
};

type NodeResultSubset = {
  html: string;
  xpath?: string[];
  ancestry?: UnlabelledFrameSelector;
  any: CheckResultSubset[];
  all: CheckResultSubset[];
  none: CheckResultSubset[];
  element?: HTMLElement;
};

type CheckResultSubset = {
  id: string;
  message: string;
  relatedNodes?: RelatedNodeSubset[];
};

type RelatedNodeSubset = {
  html: string;
};

type AggregatedResults = {
  resultsSummary: Record<string, number>;
  resultsList: ResultSubset[];
};

export function aggregateResults(results: Result[]): AggregatedResults {
  const resultsSummary = {};
  const rawResultsList = [];

  // Mapping of a11y violation categories to axe-core Result id values
  const resultCategoryMapping = {
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

  results.forEach((result) => {
    for (const categorys in resultCategoryMapping) {
      if (resultCategoryMapping[categorys].includes(result.id)) {
        // Get the total number of NodeResult objects for each violation category
        if (!resultsSummary[categorys]) {
          resultsSummary[categorys] = result.nodes.length;
        } else {
          resultsSummary[categorys] += result.nodes.length;
        }
        rawResultsList.push(result);
        break;
      }
    }
  });

  return {
    resultsSummary,
    resultsList: getResultsListSubset(rawResultsList),
  };
}

function getResultsListSubset(results: Result[]): ResultSubset[] {
  return results.map((result) => ({
    description: result.description,
    helpUrl: result.helpUrl,
    id: result.id,
    tags: result.tags,
    nodes: getNodeResultsSubset(result.nodes),
    scanDate: result.scanDate ? result.scanDate : new Date().toISOString(),
  }));
}

function getNodeResultsSubset(nodes: NodeResult[]): NodeResultSubset[] {
  return nodes.map((node) => ({
    html: node.html,
    xpath: node.xpath,
    ancestry: node.ancestry,
    any: getCheckResultSubset(node.any),
    all: getCheckResultSubset(node.all),
    none: getCheckResultSubset(node.none),
    element: node.element,
  }));
}

function getCheckResultSubset(checks: CheckResult[]): CheckResultSubset[] {
  return checks.map((check) => ({
    id: check.id,
    message: check.message,
    relatedNodes: getRelatedNodeSubset(check.relatedNodes),
  }));
}

function getRelatedNodeSubset(
  relatedNodes: RelatedNode[],
): RelatedNodeSubset[] {
  return relatedNodes.map((relatedNode) => ({
    html: relatedNode.html,
  }));
}
