import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  title: string;
  description: string;
  price: number;
  stock: number;
}

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export async function main() {
  const productsData = [
    {
      title: 'Product 1',
      description: 'Description 1',
      price: 100,
      stock: 100,
    },
    {
      title: 'Product 2',
      description: 'Description 2',
      price: 200,
      stock: 200,
    },
  ];

  async function createProduct(product: Product) {
    const productId = uuidv4();
    const productCommand = new PutItemCommand({
      TableName: productsTableName,
      Item: {
        id: { S: productId },
        title: { S: product.title },
        description: { S: product.description },
        price: { N: product.price.toString() },
      },
    });

    await dynamoDB.send(productCommand);
    return productId;
  }

  async function addToStock(productId: string, count: number) {
    const stockCommand = new PutItemCommand({
      TableName: stockTableName,
      Item: {
        product_id: { S: productId },
        count: { N: count.toString() },
      },
    });

    await dynamoDB.send(stockCommand);
  }

  for (const product of productsData) {
    const productId = await createProduct(product);
    await addToStock(productId, product.stock);
  }

  console.log('Data insertion complete.');
}

main().catch(console.error);
