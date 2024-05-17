import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
  try {
    console.log('authorization handler event', event);

    const creds = decodeAuthHeader(event.authorizationToken);
    const passFromEnv = await getUserPass(creds.login);

    const isUserAllowed =
      creds.login && creds.login === process.env.USER_PASSWORD
        ? 'Allow'
        : 'Deny';

    const iamPolicy = generatePolicy(
      creds.login,
      isUserAllowed,
      event.methodArn
    );

    return iamPolicy;
  } catch (error) {
    console.error('Error:', error);
    return generatePolicy('undefined', 'Deny', event.methodArn);
  }
  //  The Lambda function returns an IAM policy and a principle identifier.

  // If the Lambda function does not return that information,
  // the call fails and API Gateway returns a 401 UNAUTHORIZED HTTP response.
};

function generatePolicy(principalId: string, effect: string, resource: string) {
  return {
    principalId: principalId,
    policyDocument: {
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
      Version: '2012-10-17',
    },
  };
}

function decodeAuthHeader(authHeader: string) {
  if (!authHeader.startsWith('Basic ')) {
    throw new Error('Invalid authorization header');
  }

  const encodedCreds = authHeader.split('Basic ')[1];
  console.log('encodedCreds: ', encodedCreds);
  const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('utf-8');
  const [login, password] = decodedCreds.split(':');

  return { login, password };
}

async function getUserPass(login: string) {
  return process.env[login];
}
