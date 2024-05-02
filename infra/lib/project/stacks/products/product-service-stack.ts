// Filename: product-service-stack.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const lambdaPath = '../../../../lib/project/lambda';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve existing DynamoDB tables
    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ProductsTable',
      'products'
    );
    const stockTable = dynamodb.Table.fromTableName(
      this,
      'StockTable',
      'stock'
    );

    // Set up the API Gateway
    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service API',
      description: 'This service serves products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS.concat(['Authorization']),
      },
    });

    const getProductsList = new lambda.Function(this, 'GetProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'products/handlers/getProductsList.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, lambdaPath)),
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCK_TABLE_NAME: 'stock',
      },
    });
    // Grant read permissions to the Lambda function for products and stock tables
    productsTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsList);
    // Add path
    const productsResource = api.root.addResource('product');
    productsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsList)
    );

    // Define the Lambda function for getting a product by ID
    const getProductsById = new lambda.Function(this, 'GetProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'products/handlers/getProductsById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, lambdaPath)),
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCK_TABLE_NAME: 'stock',
      },
    });
    // Grant read permissions to the Lambda function for products and stock tables
    productsTable.grantReadData(getProductsById);
    stockTable.grantReadData(getProductsById);
    // Add path
    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsById)
    );

    // Define the Lambda function for getting a product by ID
    const createProduct = new lambda.Function(this, 'CreateProduct', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'products/handlers/createProduct.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, lambdaPath)),
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCK_TABLE_NAME: 'stock',
      },
    });
    // Grant read permissions to the Lambda function for products and stock tables
    productsTable.grantReadData(createProduct);
    stockTable.grantReadData(createProduct);
    productsTable.grantWriteData(createProduct);
    stockTable.grantWriteData(createProduct);
    // Add path
    productsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createProduct)
    );
  }
}
