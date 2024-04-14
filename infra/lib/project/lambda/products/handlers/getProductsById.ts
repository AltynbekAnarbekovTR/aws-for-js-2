import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  let mockProducts: Array<{ id: string }> | undefined;
  let product: { id: string } | undefined;

  const productId = event.pathParameters?.productId;

  if (process.env.PRODUCTS) {
    mockProducts = JSON.parse(process.env.PRODUCTS);
    if (mockProducts)
      product = mockProducts.find((p) => String(p.id) === productId);
  }

  // Retrieve the productId from the path parameter
  if (!!product) {
    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }
};
