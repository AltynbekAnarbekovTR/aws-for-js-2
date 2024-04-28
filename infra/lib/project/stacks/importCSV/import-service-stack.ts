import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

const lambdaPath = 'lib/project/lambda';
// const lambdaPath = '../../../../lib/project/lambda';
const handlersPath = 'import/handlers';

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
      handler: `${handlersPath}/importProductsFile.handler`,
      code: lambda.Code.fromAsset(lambdaPath),
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

    // Define the Lambda function for parsing
    const parserLambda = new lambda.Function(this, 'ImportFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: `${handlersPath}/parser.handler`,
      code: lambda.Code.fromAsset(lambdaPath),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function read permissions to the S3 bucket
    bucket.grantReadWrite(parserLambda);
    bucket.grantDelete(parserLambda);

    // Set up the S3 event notification
    bucket.addObjectCreatedNotification(
      new s3n.LambdaDestination(parserLambda),
      {
        prefix: 'uploaded/',
      }
    );
  }
}
