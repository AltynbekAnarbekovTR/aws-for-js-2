// infra\lib\project\lambda\import\handlers\importProductsFile.ts:
import { Handler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client();

export const handler: Handler = async (event) => {
  console.log('Pre-signed url handler event:', event);

  const fileName = event.queryStringParameters.name;
  if (!fileName) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Parameter of file name is not provided',
      }),
    };
  }

  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `uploaded/${fileName}`,
    };

    const command = new PutObjectCommand(params);
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expires in 5 minutes

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: signedUrl }),
    };
  } catch (error) {
    console.log('Logged error', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: JSON.stringify(
          (error as Error).message ?? 'Failed to generate pre-signed url'
        ),
      }),
    };
  }
};
