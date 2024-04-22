import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Incoming request:', event);

  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing product ID' }),
    };
  }

  try {
    // Fetch product details
    const productResult = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Key: { id: { S: productId } },
      })
    );

    if (!productResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const product = {
      id: productResult.Item.id.S,
      title: productResult.Item.title.S,
      description: productResult.Item.description.S,
      price: Number(productResult.Item.price.N),
    };

    // Fetch stock information
    const stockResult = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.STOCK_TABLE_NAME,
        Key: { product_id: { S: productId } },
      })
    );

    const stock = stockResult.Item ? Number(stockResult.Item.count.N) : 0;

    // Combine product and stock information
    const response = {
      ...product,
      stock,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
