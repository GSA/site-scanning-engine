/**
 * AnalysisDto.
 */
export type AnalysisDto = {
  queueCounts: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
  };
  total: number;
  totalFinalUrlBaseDomains: number;
  totalAgencies: number;
};
