import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import serverless from 'serverless-http';
import { Handler, Context, Callback } from 'aws-lambda';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init(); // Initialize the app
  return app;
}

let server;

const bootstrapServer = bootstrap().then(app => {
  server = serverless(app.getHttpAdapter().getInstance());
});

export const handler: Handler = (
  event: any,
  context: Context,
  callback: Callback,
) => {
  bootstrapServer.then(() => {
    server(event, context, callback);
  });
};
