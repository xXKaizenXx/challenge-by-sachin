import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as morgan from 'morgan';
import * as config from 'config';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';
import { readCsvFile } from './seeder';
import * as express from 'express';

const serverConfig = config.get('server');
const dbConfig = config.get('db');
const sessionConfig = config.get('Session');

const port = process.env.PORT || serverConfig?.port;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));
  const logger = new Logger('bootstrap');

  app.enableCors();
  app.use(helmet());
  app.use(morgan('combined'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  setupSwagger(app);
  await app.listen(port, '127.0.0.1', () => {
    logger.log(`App init db in ${dbConfig.env}`);
    logger.log(
      `Application listening on port  ${port} in ${process.env.NODE_ENV} mode `,
    );
  });
}
bootstrap();
