import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthorizationService } from '../authorization/authorization-stack';
import { ImportService } from '../importCSV/import-service';

export class ImportStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authService = new AuthorizationService(this, 'AuthService');

    new ImportService(this, 'ImportService', {
      lambdaTokenAuthorizer: authService.tokenAuthorizer,
    });
  }
}
