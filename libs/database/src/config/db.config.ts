/**
 * returns the appropriate database credentials for the environment.
 */
export default () => {
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const rds = vcap['aws-rds'][0];
    return {
      database: {
        url: rds.credentials.uri,
        // require ssl in the cloud.gov environment
        ssl: true,
      },
    };
  } else {
    const pgUser = process.env.POSTGRES_USER;
    const pgPassword = process.env.POSTGRES_PASSWORD;
    const dbHost = process.env.DATABASE_HOST;
    const dbPort = process.env.DATABASE_PORT;
    return {
      database: {
        url: `postgresql://${pgUser}:${pgPassword}@${dbHost}:${dbPort}`,
        ssl: process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'test',
      },
    };
  }
};
