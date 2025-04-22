/**
 * returns the appropriate snapshot filenames for the environment.
 */
export default () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      fileNameLive: 'weekly-snapshot',
      fileNameUnique: 'weekly-snapshot-unique',
      fileNameAll: 'weekly-snapshot-all',
      fileNameAccessibility: 'weekly-snapshot-accessibility-details',
      fileNameDailyLive: 'site-scanning-live-filtered-latest',
      fileNameDailyUnique: 'site-scanning-live-filtered-unique-latest',
      fileNameDailyAll: 'site-scanning-latest',
    };
  } else {
    return {
      fileNameLive: `weekly-snapshot-${process.env.NODE_ENV}`,
      fileNameUnique: `weekly-snapshot-unique-${process.env.NODE_ENV}`,
      fileNameAll: `weekly-snapshot-all-${process.env.NODE_ENV}`,
      fileNameAccessibility: `weekly-snapshot-accessibility-details-${process.env.NODE_ENV}`,
      fileNameDailyLive: `site-scanning-live-filtered-latest-${process.env.NODE_ENV}`,
      fileNameDailyUnique: `site-scanning-live-filtered-unique-latest-${process.env.NODE_ENV}`,
      fileNameDailyAll: `site-scanning-latest-${process.env.NODE_ENV}`,
    };
  }
};
