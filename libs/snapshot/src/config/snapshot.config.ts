/**
 * returns the appropriate snapshot filenames for the environment.
 */
export default () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      fileNameDailyLive: 'site-scanning-live-latest',
      fileNameDailyLiveFiltered: 'site-scanning-live-filtered-latest',
      fileNameDailyLiveFilteredUnique:
        'site-scanning-live-filtered-unique-latest',
      fileNameDailyAll: 'site-scanning-latest',
      fileNameAccessibility: 'weekly-snapshot-accessibility-details',
    };
  } else {
    return {
      fileNameDailyLive: `site-scanning-live-latest-${process.env.NODE_ENV}`,
      fileNameDailyLiveFiltered: `site-scanning-live-filtered-latest-${process.env.NODE_ENV}`,
      fileNameDailyLiveFilteredUnique: `site-scanning-live-filtered-unique-latest-${process.env.NODE_ENV}`,
      fileNameDailyAll: `site-scanning-latest-${process.env.NODE_ENV}`,
      fileNameAccessibility: `weekly-snapshot-accessibility-details-${process.env.NODE_ENV}`,
    };
  }
};
