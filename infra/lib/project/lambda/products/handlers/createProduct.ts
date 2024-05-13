// infra\lib\project\lambda\products\handlers\createProduct.ts:
import { Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  console.log('Incoming request:', event);

  const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
  let productData;

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is missing' }),
    };
  }

  try {
    productData = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request body' }),
    };
  }

  const { title, description, price, count } = productData;
  if (!title || !description || price == null || count == null) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Missing required fields: title, description, price, count',
      }),
    };
  }

  const productId = uuidv4();

  try {
    // Create product item
    await dynamoDB.send(
      new PutItemCommand({
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Item: {
          id: { S: productId },
          title: { S: title },
          description: { S: description },
          price: { N: price.toString() },
        },
      })
    );

    // Create stock item
    await dynamoDB.send(
      new PutItemCommand({
        TableName: process.env.STOCK_TABLE_NAME, // Ensure this environment variable is set
        Item: {
          product_id: { S: productId },
          count: { N: count.toString() },
        },
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ id: productId, title, description, price, count }),
    };
  } catch (error) {
    console.error('DynamoDB Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Failed to create product and update stock',
      }),
    };
  }
};
