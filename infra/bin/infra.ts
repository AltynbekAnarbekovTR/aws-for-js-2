#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/project/stacks/web-app/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/project/stacks/products/product-service-stack';
import { DynamoStack } from '../lib/project/stacks/dynamo/dynamo-stack';
import { RdsLambdaStack } from '../lib/project/stacks/rds/rds-stack';
import { ImportServiceStack } from '../lib/project/stacks/importCSV/import-service-stack';

const app = new cdk.App();
new DeployWebAppStack(app, 'DeployWebAppStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
new ProductServiceStack(app, 'ProductServiceStack');
new DynamoStack(app, 'DynamoStack');
new RdsLambdaStack(app, 'RdsLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
new ImportServiceStack(app, 'ImportServiceStack');
