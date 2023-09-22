export default () => {
  if (process.env.VCAP_SERVICES) {
    const vcap = JSON.parse(process.env.VCAP_SERVICES);
    const s3 = vcap['s3'][0];
    return {
      s3: {
        bucketName: s3.credentials.bucket,
        endpoint: s3.credentials.fips_endpoint,
        accessKeyId: s3.credentials.access_key_id,
        secretAccessKey: s3.credentials.secret_access_key,
        region: s3.credentials.region,
      },
    };
  } else {
    // config for local dev
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const s3Host = process.env.S3_HOSTNAME;
    const s3Port = process.env.S3_PORT;
    const s3BucketName = process.env.S3_BUCKET_NAME;
    const s3region = process.env.S3_REGION;
    return {
      s3: {
        bucketName: s3BucketName,
        endpoint: `http://${s3Host}:${s3Port}`,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: s3region,
      },
    };
  }
};
