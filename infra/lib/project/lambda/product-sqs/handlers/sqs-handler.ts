// infra\lib\project\lambda\product-sqs\handlers\sqs-handler.ts
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log('sqs-handler event: ', event);

  try {
    const records = event.Records.map(async (record) => {
      const { title, description, price, count } = JSON.parse(record.body);
      await dynamoDB.send(
        new PutItemCommand({
          TableName: process.env.PRODUCTS_TABLE_NAME,
          Item: {
            id: { S: uuidv4() },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
            count: { N: count.toString() },
          },
        })
      );
    });
    await Promise.all(records);
    return { statusCode: 200, body: JSON.stringify('Processed') };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
