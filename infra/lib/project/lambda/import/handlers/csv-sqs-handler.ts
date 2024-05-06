// In your Lambda functions directory (catalogBatchProcess.ts)
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const handler = async (event: SQSEvent): Promise<any> => {
  console.log('sqs-handler event: ', event);
  await new Promise(async (resolve, reject) => {
    try {
      const records = event.Records.map(async (record) => {
        const { title, description, price, count } = JSON.parse(record.body);
        const productId = uuidv4();
        await dynamoDB.send(
          new PutItemCommand({
            TableName: process.env.PRODUCTS_TABLE_NAME,
            Item: {
              id: { S: productId }, // UUID function import required
              title: { S: title },
              description: { S: description },
              price: { N: price.toString() },
            },
          })
        );
        await dynamoDB.send(
          new PutItemCommand({
            TableName: process.env.STOCK_TABLE_NAME, // Ensure this environment variable is set
            Item: {
              product_id: { S: productId },
              count: { N: count.toString() },
            },
          })
        );
        // Publish event to the SNS topic
        await snsClient.send(
          new PublishCommand({
            TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
            Message: JSON.stringify({
              productId: productId,
              title: title,
              description: description,
              price: price,
              count: count,
            }),
          })
        );
      });
      await Promise.all(records);
      return { statusCode: 200, body: JSON.stringify('Processed') };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, body: JSON.stringify(error) };
    }
  });
};
