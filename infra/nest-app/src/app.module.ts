import { Module } from '@nestjs/common';
import 'dotenv/config';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { TypeOrmModule } from '@nestjs/typeorm';

const { RDS_HOSTNAME, RDS_PORT, RDS_USERNAME, RDS_PASSWORD, RDS_DB_NAME } =
  process.env;

// console.log({
//   RDS_HOSTNAME,
//   RDS_PORT,
//   RDS_USERNAME,
//   RDS_PASSWORD,
//   RDS_DB_NAME,
// });

// TypeOrmModule.forRoot({
//   type: 'postgres',
//   host: RDS_HOSTNAME,
//   port: +RDS_PORT,
//   username: RDS_USERNAME,
//   password: RDS_PASSWORD,
//   database: RDS_DB_NAME,
//   entities: [CartEntity, CartItemEntity, OrderEntity],
//   logging: true,
//   ssl: {
//     rejectUnauthorized: false,
//   },
//   synchronize: false,
// }),

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: RDS_HOSTNAME,
      port: +RDS_PORT,
      username: RDS_USERNAME,
      password: RDS_PASSWORD,
      database: RDS_DB_NAME,
      entities: [],
      synchronize: true,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    AuthModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
