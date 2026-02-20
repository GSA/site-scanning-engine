/**
 * returns the appropriate snapshot filenames for the environment.
 */
export default () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      fileNameAccessibility: 'weekly-snapshot-accessibility-details',
      fileNameDailyLive: 'site-scanning-live-filtered-latest',
      fileNameDailyUnique: 'site-scanning-live-filtered-unique-latest',
      fileNameDailyAll: 'site-scanning-latest',
    };
  } else {
    return {
      fileNameAccessibility: `weekly-snapshot-accessibility-details-${process.env.NODE_ENV}`,
      fileNameDailyLive: `site-scanning-live-filtered-latest-${process.env.NODE_ENV}`,
      fileNameDailyUnique: `site-scanning-live-filtered-unique-latest-${process.env.NODE_ENV}`,
      fileNameDailyAll: `site-scanning-latest-${process.env.NODE_ENV}`,
    };
  }
};
