import { APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductsList } from '../handlers/getProductsList';

describe('getProductsList Handler', () => {
  it('returns all products', async () => {
    const event = {}; // Mock event object
    const context = {}; // Mock context object

    // Mock environment variable
    process.env.PRODUCTS = JSON.stringify([
      { id: 1, title: 'Product A', price: 20 },
      { id: 2, title: 'Product B', price: 30 },
      { id: 3, title: 'Product C', price: 40 },
    ]);

    const result = (await getProductsList(
      event as any,
      context as any,
      () => {}
    )) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('Product A');
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
