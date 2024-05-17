import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dotenv from 'dotenv';
const LAMBDA_PATH = 'lib/project/lambda/authorization';
dotenv.config();

const GITHUB_NAME = 'AltynbekAnarbekovTR';

export class AuthService extends Construct {
  lambdaTokenAuthorizer: apigateway.TokenAuthorizer;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda, which takes incoming request and checks the auth
    const authorizerLambda = new lambda.Function(
      this,
      'authentication-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(10),
        handler: 'handlers/authorization.handler',
        code: lambda.Code.fromAsset(LAMBDA_PATH),
        environment: {
          USER_PASSWORD: process.env[GITHUB_NAME] as string,
        },
      }
    );

    // Token Authorization, which will be injected to API Gateway
    this.lambdaTokenAuthorizer = new apigateway.TokenAuthorizer(
      this,
      'operationalAuthorizer',
      {
        handler: authorizerLambda,
        identitySource: apigateway.IdentitySource.header('Authorization'),
      }
    );
  }
}
