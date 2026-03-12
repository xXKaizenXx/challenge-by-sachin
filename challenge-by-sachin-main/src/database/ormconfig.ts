import { SnakeNamingStrategy } from '../snake-naming.strategy';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
import { readFileSync } from 'fs';
import * as path from 'path';
import { UserSubscriber } from '../entity-subscribers';

const dbConfig = config.get('db');
console.log('DB CONFIG: ', dbConfig);
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: dbConfig.synchronize,
  cache: false,
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: [UserSubscriber],
};
