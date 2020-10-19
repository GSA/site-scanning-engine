/**
 * return the appropriate message queue configuration
 */

export default () => {
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const redis = vcap['redis32'][0];
    return {
      redis: {
        host: redis.credentials.hostname,
        port: redis.credentials.port,
        password: redis.credentials.password,
      },
    };
  } else {
    return {
      redis: {
        host: process.env.QUEUE_HOST,
        port: process.env.QUEUE_PORT,
        password: process.env.QUEUE_PASSWORD,
      },
    };
  }
};
