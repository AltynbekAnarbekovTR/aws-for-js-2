// infra\lib\project\lambda\import\handlers\parser.ts:
import { Handler } from 'aws-lambda';

const {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const csvParser = require('csv-parser');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const queueUrl = process.env.SQS_QUEUE_URL;
console.log('queueUrl: ', queueUrl);

const processRecord = async (record: any) => {
  const sqsParams = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(record),
  };
  await sqs.send(new SendMessageCommand(sqsParams));
};

const s3 = new S3Client();
const PARSED_FOLDER = 'parsed/';
const uploadPath = process.env.UPLOAD_PATH as string;
const bucketName = process.env.BUCKET_NAME;

interface Row {
  data: string;
}

const moveFile = async (bucketName: string, key: string) => {
  const newKey = key.replace(uploadPath, PARSED_FOLDER);
  // Copy the file to the new location
  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: newKey,
      })
    );
    console.log('File copied to:', newKey);

    // Delete the original file
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    console.log('Original file deleted:', key);
  } catch (err) {
    console.error('Error moving file:', err);
  }
};

export const handler: Handler = async (event) => {
  console.log('Parser handler event:', event);
  for (const record of event.Records) {
    // const bucketName = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const getObjectParams = {
        Bucket: bucketName,
        Key: key,
      };
      const data = await s3.send(new GetObjectCommand(getObjectParams));
      await new Promise((resolve, reject) => {
        const stream = data.Body.pipe(csvParser());
        stream.on('data', processRecord);
        stream.on('end', async () => {
          console.log('CSV file successfully processed');
          if (bucketName) {
            await moveFile(bucketName, key);
          } else reject('Bucket name not provided');
          resolve('Parsed');
        });
      });
    } catch (err) {
      console.error('Error processing S3 event:', err);
    }
  }
};
