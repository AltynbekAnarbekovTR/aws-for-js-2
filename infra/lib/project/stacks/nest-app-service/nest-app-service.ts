import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

const LAMBDA_PATH = '../../alt-rs-cart-api/dist';

export class NestJsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2, // Default is all AZs in the region
    });

    const securityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access'
    );

    const database = new rds.DatabaseInstance(this, 'PostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      // instanceType: ec2.InstanceType.of(
      //   ec2.InstanceClass.BURSTABLE2,
      //   ec2.InstanceSize.SMALL
      // ),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      securityGroups: [securityGroup],
      databaseName: 'CartServiceDB',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
    });

    const nestLambda = new lambda.Function(this, 'CustomerCrudLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(LAMBDA_PATH),
      environment: {
        NODE_ENV: 'production',
        DB_HOST: database.dbInstanceEndpointAddress,
        DB_PORT: database.dbInstanceEndpointPort,
        // DB_USER:
        //   database.secret?.secretValueFromJson('username')?.toString() ??
        //   'Missing user',
        // DB_PASSWORD:
        //   database.secret?.secretValueFromJson('password')?.toString() ??
        //   'Missing password',
        DB_SECRET_ARN: database.secret?.secretArn ?? 'No secret ARN',
        DB_NAME: 'CartDB',
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
