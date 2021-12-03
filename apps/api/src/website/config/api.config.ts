/**
 * returns the appropriate api key for the environment.
 */
export default () => {
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const apiKey = vcap['API_KEY'][0];
    return {
      apiKey: apiKey,
    };
  } else {
    const apiKey = process.env.API_KEY;
    return {
      apiKey: apiKey,
    };
  }
};
