# cloudwatch-to-papertrail-lambda
cloudwatch-to-papertrail-lambda is an AWS Lambda function that will forward logs from a single AWS Cloudwatch Logs LogGroup to Papertrail.

This project will generate a zip file that you use as the source for an AWS lambda. The zip file that is generated is configured solely through your lambda's runtime environment. (This is a different approach than other projects and is what prompted me to make this in the first place).

If you have multiple log groups you want to send to Papertrail, you will need to setup a separate lambda for each one (with it's own environment variables). You can use the same zip file though, you don't need to build it for each one. The lambda gets all of it's configuration from the environment variables in it's execution context.

This was derived from the [PaperWatch](https://github.com/Signiant/PaperWatch) project.

### Setup

#### Build
`npm install`

`npm run build`

#### Deploy
There are many ways to deploy a lambda. We leave the method up to you. Use the `cloudwatch-to-papertrail-lambda.zip` from above as
the source for the lambda.

There are 3 environment variables that *must* be available to this lambda to run:

| Key | Required | Type | Description |
| ----- | ----- | ---------- | ----------|
| `PAPERTRAIL_HOST` | Yes  | _String_ | The Papertrail endpoint hostname |
| `PAPERTRAIL_PORT` | Yes | _Number_ | The Papertrail endpoint port |
| `PAPERTRAIL_NAME` | Yes | _String_ | This is the name that shows up in each Papertrail log entry.|


#### Subscribe AWS Log Group
In AWS Cloudwatch Logs, find the log group you want to go to papertrail, and 'Stream to AWS Lambda'.
Select the lambda you created above, and choose `Other` as the log format.

#### Multiple log groups
If you want more than one log group's logs sent to Papertrail, you will need to deploy a new lambda for that log group. You *do not* need to generate a new `cloudwatch-to-papertrail-lambda.zip` for each one though.


### CDK

If you're using [AWS CDK](https://aws.amazon.com/cdk/), clone this repository into your CDK's `lib` folder.

Once it is in your CDK's `lib` folder, run: `npm install`

Modify this snippet to your needs (yes, I should really make it a CDK Construct).

Assuming you fill in the `PAPERTRAIL_HOST`, `PAPERTRAIL_PORT`, and `PAPERTRAIL_NAME` values, and use the `appLogGroup` that you have, this should be all you need to do:

```
  const papertrailLambda = new lambda.Function(this, 'PapertrailLambda', {
    runtime: lambda.Runtime.NODEJS_10_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset(path.join(__dirname, 'cloudwatch-to-papertrail-lambda')),
    environment: {
      'PAPERTRAIL_HOST': 'logsX.papertrailapp.com',
      'PAPERTRAIL_PORT': 'XXXXX',
      'PAPERTRAIL_NAME': 'MyApp',
    },
  });
  const papertrailLambdaDestination = new LambdaDestination(papertrailLambda);
  appLogGroup.addSubscriptionFilter('appLogGroupStream', {destination: papertrailLambdaDestination, filterPattern: FilterPattern.allEvents()})
```

Alternatively, you can build the lambda zip file and upload it to one of your S3 buckets. Using this method is a little cleaner, as you don't need to clone this repo inside your CDK project, you can download and build it separate directory. Also: once the zip file is uploaded to S3, you don't really need this repository anymore.

Your config would look more like this:

```
  const papertrailLambda = new lambda.Function(this, 'PapertrailLambda', {
    runtime: lambda.Runtime.NODEJS_10_X,
    handler: 'index.handler',
    code: lambda.Code.fromBucket(s3.Bucket.fromBucketName(this, 'my-bucket', 'my-bucket'), 'cloudwatch-to-papertrail-lambda.zip'),
    environment: {
      'PAPERTRAIL_HOST': 'logsX.papertrailapp.com',
      'PAPERTRAIL_PORT': 'XXXXX',
      'PAPERTRAIL_NAME': 'MyApp',
    },
  });
  const papertrailLambdaDestination = new LambdaDestination(papertrailLambda);
  appLogGroup.addSubscriptionFilter('appLogGroupStream', {destination: papertrailLambdaDestination, filterPattern: FilterPattern.allEvents()})
```
