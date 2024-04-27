import { Handler } from 'aws-lambda';

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const csvParser = require('csv-parser');
const s3 = new S3Client();

interface Row {
  data: string;
}

export const handler: Handler = async (event) => {
  console.log('Parser handler event:', event);
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const getObjectParams = {
        Bucket: bucketName,
        Key: key,
      };
      const data = await s3.send(new GetObjectCommand(getObjectParams));

      // Stream the S3 file and parse it with csv-parser
      data.Body.pipe(csvParser())
        .on('data', (row: Row) => {
          console.log('Parsed row:', row);
        })
        .on('end', () => {
          console.log('CSV file successfully processed');
        });
    } catch (err) {
      console.error('Error processing S3 event:', err);
    }
  }
};
