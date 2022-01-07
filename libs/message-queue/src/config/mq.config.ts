/**
 * return the appropriate message queue configuration
 */

export default () => {
  const env = process.env.NODE_ENV;
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const redis = vcap['aws-elasticache-redis'][0];
    return {
      redis: {
        host: redis.credentials.hostname,
        port: redis.credentials.port,
        password: redis.credentials.password,
        env: env,
      },
    };
  } else {
    return {
      redis: {
        host: process.env.QUEUE_HOST,
        port: process.env.QUEUE_PORT,
        password: process.env.QUEUE_PASSWORD,
        env: env,
      },
    };
  }
};
