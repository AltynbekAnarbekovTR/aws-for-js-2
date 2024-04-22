import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Incoming request:', event);

  try {
    const productsResult = await dynamoDBClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE_NAME,
      })
    );

    const products = productsResult.Items || [];

    // Fetch stock counts and join with products
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        if (!product.id.S) {
          console.error('Product ID is undefined', product);
          throw new Error('Product ID is undefined');
        }

        const stockResult = await dynamoDBClient.send(
          new QueryCommand({
            TableName: process.env.STOCK_TABLE_NAME,
            KeyConditionExpression: 'product_id = :product_id',
            ExpressionAttributeValues: {
              ':product_id': { S: product.id.S },
            },
          })
        );

        const stock = stockResult.Items?.[0]; // Assuming there is one stock item per product

        return {
          id: product.id.S,
          title: product.title.S,
          description: product.description.S,
          price: Number(product.price.N),
          count: stock ? Number(stock.count.N) : 0,
        };
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(enrichedProducts),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Failed to retrieve products' }),
    };
  }
};
