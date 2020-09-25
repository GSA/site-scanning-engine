# Architecture Documentation

This directory has information about the architecture and infrastructure of the Scanner application. 

## diagrams

The [diagrams](./diagrams) directory contains code that generates architecture diagrams. The diagram generator uses a Python library called "diagrams" which has a DSL for expressing architecture diagrams. Currently, there are several different architectural "solutions" as we haven't decided which direction to take with the architecture just yet. 


### AWS 
![Image Description: An architecture diagram showing AWS services. Described in text below](./diagrams/images/architecture-aws.png)

The AWS archiecture is serverless, i.e., uses AWS-managed services to cut down on undifferentiated heavy-lifting of operations. See (CIO.gov whitepaper)[https://www.cio.gov/resources/Demystifying%20NoOps%20and%20Serverless%20Computing_FINAL.pdf] on "NoOps" and Serverless. _Note: I firmly believe that NoOps is a myth, but DiffOps is very true! The history of cloud computing is basically the history of abstracting infrastructure and focusing on business value. Operations needs change at each level of evolution._

The AWS Architecture comprises 3 main components: 1) Nightly Scanning, 2) Data and Storage, 3) API. 

#### Nightly Scanning
The Nightly Scanning component is a serverless batch processor. This component is triggered by a nightly cron event (powered by EventBridge or CloudWatch Events). This calls an AWS Lambda producer which gathers a list of federal domains and some information about the agency owner of the domain. The producer adds jobs to the consumer queue (powered by SQS). These jobs are expressed as JSON in a schema similar to the following: 

```json
{
    "url": "18f.gov",
    "branch": "executive",
    "agency": "GSA",
    "agencyCode": "111",
    ...
}
```

Next, the subscribers (either Fargate Instances or Lambdas) will begin pulling jobs off the SQS Queue. These lambdas are responsible for the actual scanning logic. They are Node.js apps that are running headless Chrome through Puppeteer. These jobs write the scan data to DynamoDB. 

#### Data and Storage
We have some flexibility with regards to data storage. We could use SQL, NoSQL/Document stores, each with their own set of tradeoffs. My current thinking is something in the NoSQL family of databases considering that they are specifically well-suited for storing "warm" data, i.e., data that are useful only for a short time period. The tradeoff is less ad-hoc query-ability than you might get from a SQL store due to NoSQL relying on indexes for performance. 

Currently, I am thinking that DocumentDB would be a strong contender. It's an AWS Mangaged (Serverless) MongoDB instance. Mongo is specifically designed for JSON which is the form our scan results will take. Another feature that could be beneficial for our uses case is that DocumentDB allows us to specify a document's Time To Live (TTL) before deletion. We can subscribe to the TTL Deletes and use those for data archival for long-term analytics storage. 

We can use S3 for "cold" storage. AWS Athena is a good fit for doing analytic queries in S3. 

#### API
The API could pretty much be any webapp, but for the sake of completeness, I've included a serverless API architecture here. The API is proxied through api.data.gov, which provides analytics and API key management, and includes the data in a single key ecosytem. Next the request goes to API Gateway which routes it to a Lambda. The lambda will handle any data retrieval from the datastore and, as it is a Node.js app, can share data models with the scan engine. 

