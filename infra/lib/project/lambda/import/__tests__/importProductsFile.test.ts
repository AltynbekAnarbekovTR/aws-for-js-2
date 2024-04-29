import { handler } from '../handlers/importProductsFile';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Context, Callback } from 'aws-lambda';

const s3Mock = mockClient(S3Client);

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'testFunction',
  functionVersion: '1',
  invokedFunctionArn:
    'arn:aws:lambda:us-west-2:123456789012:function:testFunction',
  memoryLimitInMB: '128',
  awsRequestId: 'unique-request-id',
  logGroupName: '/aws/lambda/testFunction',
  logStreamName: '2023/01/01[$LATEST]unique-request-id',
  getRemainingTimeInMillis: () => 5000,
  done: (error?: Error, result?: any) => {},
  fail: (error: Error | string) => {},
  succeed: (messageOrObject: any) => {},
};

describe('Lambda Handler Tests', () => {
  beforeEach(() => {
    s3Mock.reset();
    process.env.BUCKET_NAME = 'test-bucket';
  });

  afterEach(() => {
    delete process.env.BUCKET_NAME;
  });

  it('should return 400 if no file name is provided', (done) => {
    const event = { queryStringParameters: {} };
    const callback = {};
    handler(event as any, mockContext, callback as any);
  });

  it('should generate a pre-signed URL and return 200', (done) => {
    const fileName = 'testfile.txt';
    s3Mock
      .on(PutObjectCommand, {
        Bucket: 'test-bucket',
        Key: `uploaded/${fileName}`,
      })
      .resolves({});

    const event = {
      queryStringParameters: {
        name: fileName,
      },
    };
    const callback: Callback = (error, response) => {
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.url).toBeDefined();
      done();
    };

    handler(event as any, mockContext, callback);
  });

  it('should handle S3 errors and return 500', (done) => {
    const fileName = 'testfile.txt';
    s3Mock
      .on(PutObjectCommand, {
        Bucket: 'test-bucket',
        Key: `uploaded/${fileName}`,
      })
      .rejects(new Error('S3 error'));

    const event = {
      queryStringParameters: {
        name: fileName,
      },
    };
    const callback: Callback = (error, response) => {
      expect(response.statusCode).toBe(500);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toContain('S3 error');
      done();
    };

    handler(event as any, mockContext, callback);
  });
});
