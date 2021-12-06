/**
 * returns the appropriate api key for the environment.
 */
export default () => {
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const apiKey = vcap.hasOwnProperty('user-provided')
      ? vcap['user-provided'][0]['credentials']['API_KEY']
      : undefined;
    if (apiKey === undefined) {
      throw 'No API_KEY Found';
    }
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
