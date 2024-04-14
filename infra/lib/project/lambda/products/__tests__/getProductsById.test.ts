import { APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductsById } from '../handlers/getProductsById';

describe('getProductsById Handler', () => {
  it('returns the product by ID', async () => {
    const event = {
      pathParameters: {
        productId: '1',
      },
    };
    const context = {};

    process.env.PRODUCTS = JSON.stringify([
      { id: '1', title: 'Product A', price: 20 },
      { id: '2', title: 'Product B', price: 30 },
      { id: '3', title: 'Product C', price: 40 },
    ]);

    const result = (await getProductsById(
      event as any,
      context as any,
      () => {}
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('Product A');
  });

  it('returns 404 if product is not found', async () => {
    const event = {
      pathParameters: {
        productId: '4', // non-existent ID
      },
    };
    const context = {};

    process.env.PRODUCTS = JSON.stringify([
      { id: '1', title: 'Product A', price: 20 },
      { id: '2', title: 'Product B', price: 30 },
      { id: '3', title: 'Product C', price: 40 },
    ]);

    const result = (await getProductsById(
      event as any,
      context as any,
      () => {}
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(404);
    expect(result.body).toContain('Product not found');
  });
});
