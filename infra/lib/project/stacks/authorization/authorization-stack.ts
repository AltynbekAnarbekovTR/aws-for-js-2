import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dotenv from 'dotenv';
dotenv.config();

const PATH_TO_LAMBDA = 'lib/project/lambda/authorization';
const ENV_KEY_GITHUB_USER = 'AltynbekAnarbekovTR';

export class AuthorizationService extends Construct {
  tokenAuthorizer: apigateway.TokenAuthorizer;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda function for authenticating incoming requests
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      handler: 'handlers/authorization.handler',
      code: lambda.Code.fromAsset(PATH_TO_LAMBDA),
      environment: {
        USER_PASSWORD: process.env[ENV_KEY_GITHUB_USER] as string,
      },
    });

    // API Gateway Token Authorizer using the Lambda function
    this.tokenAuthorizer = new apigateway.TokenAuthorizer(
      this,
      'APIGatewayTokenAuthorizer',
      {
        handler: authLambda,
        identitySource: apigateway.IdentitySource.header('Authorization'),
      }
    );
  }

  public getTokenAuthorizer(): apigateway.TokenAuthorizer {
    return this.tokenAuthorizer;
  }
}
