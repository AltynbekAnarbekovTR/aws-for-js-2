// infra\lib\project\stacks\importCSV\import-service-stack.ts:
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';

const LAMBDA_PATH = '../../alt-rs-cart-api/dist';

export class NestJsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const nestLambda = new lambda.Function(this, 'CustomerCrudLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(LAMBDA_PATH),
      environment: {
        NODE_ENV: 'production',
      },
    });

    // Define API Gateway
    const api = new apigateway.LambdaRestApi(this, 'NestApi', {
      handler: nestLambda,
      proxy: false,
    });

    // Define the root resource
    const items = api.root.addResource('items');
    items.addMethod('GET'); // GET /items
    items.addMethod('POST'); // POST /items
  }
}
