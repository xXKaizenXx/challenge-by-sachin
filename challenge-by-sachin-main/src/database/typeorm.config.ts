import { SnakeNamingStrategy } from '../snake-naming.strategy';
import * as config from 'config';
import { UserSubscriber } from '../entity-subscribers';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import * as path from 'path';

const dbConfig = config.get('db');

export const dataSource = new DataSource({
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
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
});
