import { APIGatewayProxyHandler } from 'aws-lambda';
import { createConnection, RowDataPacket } from 'mysql2/promise';

export const handler: APIGatewayProxyHandler = async (event) => {
  let connection;

  try {
    connection = await createConnection({
      host: process.env.RDS_ENDPOINT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'products_db',
    });

    // Perform the query and explicitly type the response
    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT p.id, p.title, p.description, p.price, s.count
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
    `);

    // Convert each product row to a more readable format
    const enrichedProducts = rows.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: product.count || 0, // Handling possible NULLs from LEFT JOIN
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(enrichedProducts),
    };
  } catch (error) {
    console.error('SQL Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Failed to retrieve products' }),
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
