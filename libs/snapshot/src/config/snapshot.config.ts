/**
 * returns the appropriate snapshot filenames for the environment.
 */
export default () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      fileNameLive: 'weekly-snapshot',
      fileNameAll: 'weekly-snapshot-all',
      fileNameAccessibility: 'weekly-snapshot-accessibility-details',
    };
  } else {
    return {
      fileNameLive: `weekly-snapshot-${process.env.NODE_ENV}`,
      fileNameAll: `weekly-snapshot-all-${process.env.NODE_ENV}`,
      fileNameAccessibility: `weekly-snapshot-accessibility-details-${process.env.NODE_ENV}`,
    };
  }
};
