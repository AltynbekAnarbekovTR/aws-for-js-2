import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthService } from '../authorization/authorization-stack';
import { ImportService } from '../importCSV/import-service';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authService = new AuthService(this, 'AuthService');

    new ImportService(this, 'ImportService', {
      lambdaTokenAuthorizer: authService.lambdaTokenAuthorizer,
    });
  }
}
