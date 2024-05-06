// infra\lib\project\stacks\importCSV\import-service-stack.ts:
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

const LAMBDA_PATH = 'lib/project/lambda/import';
const HANDLERS_PATH = 'import/handlers';
const UPLOAD_PATH = 'uploaded/';

export class ImportServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define the S3 bucket
    const bucket = new s3.Bucket(this, 'UploadedFilesBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: 'import-scv-bucket',
      cors: [
        {
          allowedOrigins: [
            'http://localhost:3000',
            'https://d2bvd6pkp0kdt0.cloudfront.net',
          ],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Define the Lambda function
    const lambdaFunction = new lambda.Function(this, 'ImportProductsFile', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: `handlers/importProductsFile.handler`,
      code: lambda.Code.fromAsset(LAMBDA_PATH),
      memorySize: 512,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function permissions to use the S3 bucket
    bucket.grantReadWrite(lambdaFunction);

    // Define the API Gateway
    const api = new apigateway.RestApi(this, 'ProductImportApi', {
      restApiName: 'Product Import Service',
    });

    // Define an API Gateway resource and method
    const importResource = api.root.addResource('import');
    importResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunction)
    );

    // SQS Queue
    const catalogItemsQueue = new sqs.Queue(
      this,
      'ImportServiceCatalogItemsQueue',
      {
        queueName: 'importServiceCatalogItemsQueue',
      }
    );

    // Create SNS topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      displayName: 'Product Creation Topic',
    });

    // Add an object to keep track of created subscriptions
    const createdSubscriptions: { [key: string]: sns.ITopicSubscription } = {};

    // Define filter policies
    const filterPolicy = {
      color: sns.SubscriptionFilter.stringFilter({
        allowlist: ['red', 'blue', 'green'],
      }),
      size: sns.SubscriptionFilter.stringFilter({
        allowlist: ['small', 'medium', 'large'],
      }),
    };

    // Define email subscriptions based on filter
    const emailSubscriptions: { [brbr: string]: string } = {
      redProductsSubscription: 'altynbek_anarbekov@epam.com',
      blueProductsSubscription: 'altynbek290697@gmail.com',
    };

    // Add email subscriptions with filter policies
    for (const filter in emailSubscriptions) {
      const email = emailSubscriptions[filter];

      if (!createdSubscriptions[filter]) {
        const subscription = new subs.EmailSubscription(email, {
          filterPolicy: filterPolicy,
        });
        createProductTopic.addSubscription(subscription);
      } else {
        console.log(`Subscription for filter ${filter} already exists.`);
      }
    }
    // Finish SNS

    // Later in your lambda definition
    const catalogBatchProcessLamda = new lambda.Function(
      this,
      'CatalogBatchProcess',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handlers/create-from-csv.handler',
        code: lambda.Code.fromAsset(LAMBDA_PATH),
        memorySize: 1024,
        environment: {
          PRODUCTS_TABLE_NAME: 'products',
          STOCK_TABLE_NAME: 'stock',
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    catalogBatchProcessLamda.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5, // Number of messages to process at once
      })
    );

    // Grant necessary permissions for the lambda function
    createProductTopic.grantPublish(catalogBatchProcessLamda);
    // Add email subscription
    // createProductTopic.addSubscription(
    //   new subs.EmailSubscription('altynbek290697@example.com')
    // );

    // Define the Lambda function for parsing
    const parserLambda = new lambda.Function(this, 'ImportFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: `handlers/parser.handler`,
      code: lambda.Code.fromAsset(LAMBDA_PATH),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        UPLOAD_PATH: UPLOAD_PATH,
        SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
      },
    });

    // Grant the Lambda function read permissions to the S3 bucket
    bucket.grantReadWrite(parserLambda);

    // Set up the S3 event notification
    bucket.addObjectCreatedNotification(
      new s3n.LambdaDestination(parserLambda),
      {
        prefix: 'uploaded/',
      }
    );
  }
}
