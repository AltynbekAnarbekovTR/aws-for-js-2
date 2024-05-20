import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export async function authorizationHandler(
  event: APIGatewayTokenAuthorizerEvent
) {
  console.log('Received event:', event);

  try {
    const credentials = extractCredentials(event.authorizationToken);
    const authorizationResult = authorizeUser(credentials);

    const policy = createPolicy(
      credentials.username,
      authorizationResult,
      event.methodArn
    );

    return policy;
  } catch (error) {
    console.error('Authorization Error:', error);
    return createPolicy('anonymous', 'Deny', event.methodArn);
  }
}

function createPolicy(principalId: string, effect: string, resource: string) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}

function extractCredentials(authHeader: string) {
  if (!authHeader.startsWith('Basic ')) {
    throw new Error('Invalid authorization header format.');
  }

  const base64Credentials = authHeader.split('Basic ')[1]; // Skip "Basic "
  console.log('Base64 credentials:', base64Credentials);

  const plainCredentials = Buffer.from(base64Credentials, 'base64').toString();
  const [username, password] = plainCredentials.split(':');

  return { username, password };
}

function authorizeUser({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const isValidUser = username && password === process.env.USER_PASSWORD;
  return isValidUser ? 'Allow' : 'Deny';
}
