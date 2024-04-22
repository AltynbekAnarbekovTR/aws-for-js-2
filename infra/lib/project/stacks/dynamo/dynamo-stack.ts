// Filename: Todo/TodoStack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { join } from 'path';

const ProductsTableName = 'products';
const StockTableName = 'stock';

const lambdaPath = '../../../project/lambda';

export class DynamoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, ProductsTableName, {
      tableName: ProductsTableName,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    const stockTable = new dynamodb.Table(this, StockTableName, {
      tableName: StockTableName,
      partitionKey: {
        name: 'product_id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    const populateTable = new lambda.Function(this, 'populateTable ', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'dynamo/handlers/populateDynamoDB.main',
      code: lambda.Code.fromAsset(join(__dirname, lambdaPath)),
      environment: {
        PRODUCTS_TABLE_NAME: ProductsTableName,
        STOCK_TABLE_NAME: StockTableName,
      },
    });

    productsTable.grantWriteData(populateTable);
    stockTable.grantWriteData(populateTable);
  }
}
