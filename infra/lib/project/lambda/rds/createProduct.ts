import { APIGatewayProxyHandler } from 'aws-lambda';
import { createConnection, ResultSetHeader } from 'mysql2/promise';

export const handler: APIGatewayProxyHandler = async (event) => {
  let connection;

  try {
    connection = await createConnection({
      host: process.env.RDS_ENDPOINT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'products_db',
    });

    // Parse product data from the event body
    const productData = JSON.parse(event.body || '{}');
    const { title, description, price, count } = productData;

    // Start transaction
    await connection.beginTransaction();

    // Insert into products table
    const insertProduct =
      'INSERT INTO products (title, description, price) VALUES (?, ?, ?)';
    const [productResult] = await connection.execute<ResultSetHeader>(
      insertProduct,
      [title, description, price]
    );

    // Get the ID of the newly inserted product
    const productId = productResult.insertId;

    // Insert into stock table using the new product ID
    const insertStock = 'INSERT INTO stock (product_id, count) VALUES (?, ?)';
    await connection.execute(insertStock, [productId, count]);

    // If all goes well, commit the transaction
    await connection.commit();

    // Return success response
    return {
      statusCode: 201,
      body: JSON.stringify({ id: productId, title, description, price, count }),
    };
  } catch (error) {
    // If an error occurs, rollback the transaction
    if (connection) {
      await connection.rollback();
    }
    console.error('SQL Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  } finally {
    // Always close the connection
    if (connection) {
      await connection.end();
    }
  }
};
