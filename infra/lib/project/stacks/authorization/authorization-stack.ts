// Filename: authorizer-stack/authorizer-stack.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

const LAMBDA_PATH = 'lib/project/lambda/authorization';
dotenv.config();
const apiKey = process.env.AnarbekovAltAltynbekAnarbekovTR;
console.log(apiKey);
console.log(process.env.GITHUB_ACCOUNT_LOGIN);
console.log(process.env.TEST_PASSWORD);

export class AuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, 'lambda-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/authorization.handler',
      code: lambda.Code.fromAsset(LAMBDA_PATH),
      environment: {
        API_KEY: apiKey!,
      },
    });

    // Create the basicAuthorizer lambda function
    const basicAuthorizerLambda = new lambda.Function(
      this,
      'basic-authorizer-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'handlers/authorization.handler',
        code: lambda.Code.fromAsset(LAMBDA_PATH),
        environment: {
          GITHUB_ACCOUNT_LOGIN: process.env.GITHUB_ACCOUNT_LOGIN!,
          TEST_PASSWORD: process.env.TEST_PASSWORD!,
        },
      }
    );

    const userPool = new cognito.UserPool(this, 'my-user-pool2', {
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        familyName: {
          mutable: true,
          required: true,
        },
        phoneNumber: { required: false },
      },
      customAttributes: {
        createdAt: new cognito.DateTimeAttribute(),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const appClient = userPool.addClient('my-app-client', {
      userPoolClientName: 'my-app-client',
      authFlows: {
        userPassword: true,
      },
    });

    const domain = userPool.addDomain('Domain', {
      cognitoDomain: {
        domainPrefix: 'authorization2',
      },
    });

    const api = new apigateway.RestApi(this, 'my-api', {
      restApiName: 'My API Gateway',
      description: 'This API serves the Lambda functions.',
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'my-authorizer',
      {
        authorizerName: 'my-authorizer',
        cognitoUserPools: [userPool],
      }
    );

    const helloFromLambdaIntegration = new apigateway.LambdaIntegration(
      lambdaFunction,
      {
        requestTemplates: {
          'application/json': `{ "message": "$input.params('message')" }`,
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
        ],
        proxy: false,
      }
    );

    // Create a resource /hello and GET request under it
    const helloResource = api.root.addResource('hello');
    // On this resource attach a GET method which pass reuest to our Lambda function
    helloResource.addMethod('GET', helloFromLambdaIntegration, {
      methodResponses: [{ statusCode: '200' }],
      authorizer,
    });
  }
}
