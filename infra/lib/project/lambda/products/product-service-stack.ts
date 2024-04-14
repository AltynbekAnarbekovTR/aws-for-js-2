// Filename: product-service-stack.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

// Mock data as environment variable
const mockProducts = JSON.stringify([
  { id: 1, title: 'Product A', price: 20 },
  { id: 2, title: 'Product B', price: 30 },
  { id: 3, title: 'Product C', price: 40 },
]);

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function for getting the list of all products
    const getProductsList = new lambda.Function(this, 'GetProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/getProductsList.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      environment: {
        PRODUCTS: mockProducts,
      },
    });

    // Define the Lambda function for getting a product by ID
    const getProductsById = new lambda.Function(this, 'GetProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/getProductsById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      environment: {
        PRODUCTS: mockProducts,
      },
    });

    // Set up the API Gateway
    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service API',
      description: 'This service serves products.',
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsList)
    );

    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsById)
    );
  }
}
