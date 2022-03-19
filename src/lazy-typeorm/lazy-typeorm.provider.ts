import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import { Provider } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import {
  getMetadataArgsStorage,
  AbstractRepository,
  ConnectionOptions,
  Connection,
  Repository,
} from 'typeorm';

export function createLazyTypeOrmProviders(
  entities?: EntityClassOrSchema[],
  connection?: Connection | ConnectionOptions | string,
): Provider[] {
  return (entities || []).map((entity) => ({
    provide: getRepositoryToken(entity, connection),
    useFactory: (connection: Observable<Connection>) => {
      return connection.pipe(
        map((connection: Connection) => {
          if (
            entity instanceof Function &&
            (entity.prototype instanceof Repository ||
              entity.prototype instanceof AbstractRepository)
          ) {
            return connection.getCustomRepository(entity);
          }

          return connection.options.type === 'mongodb'
            ? connection.getMongoRepository(entity)
            : connection.getRepository(entity);
        }),
      );
    },
    inject: [getConnectionToken(connection)],
    targetEntitySchema: getMetadataArgsStorage().tables.find(
      (item) => item.target === entity,
    ),
  }));
}
