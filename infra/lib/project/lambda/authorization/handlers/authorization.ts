const atobe = require('atob');

exports.handler = async (event: {
  headers: { Authorization: any; authorization: any };
}) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authorization header is required' }),
    };
  }

  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = atobe(encodedCredentials);
  const [username, password] = decodedCredentials.split(':');

  if (
    username === process.env.GITHUB_ACCOUNT_LOGIN &&
    password === process.env.TEST_PASSWORD
  ) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Access granted' }),
    };
  } else {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Access denied' }),
    };
  }
};
