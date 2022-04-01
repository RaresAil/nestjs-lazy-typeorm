import { getCustomRepositoryEntity } from '@nestjs/typeorm/dist/helpers/get-custom-repository-entity';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { EntitiesMetadataStorage } from '@nestjs/typeorm/dist/entities-metadata.storage';
import { DEFAULT_CONNECTION_NAME } from '@nestjs/typeorm/dist/typeorm.constants';
import { Connection, ConnectionOptions } from 'typeorm';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { createLazyTypeOrmProviders } from './lazy-typeorm.provider';
import { LazyTypeOrmCoreModule } from './lazy-typeorm-core.module';

@Module({})
export class LazyTypeOrmModule {
  static forRoot(options?: TypeOrmModuleOptions): DynamicModule {
    return {
      module: LazyTypeOrmModule,
      imports: [LazyTypeOrmCoreModule.forRoot(options)],
    };
  }

  static forFeature(
    entities: EntityClassOrSchema[] = [],
    connection:
      | Connection
      | ConnectionOptions
      | string = DEFAULT_CONNECTION_NAME,
  ): DynamicModule {
    const providers = createLazyTypeOrmProviders(entities, connection);
    const customRepositoryEntities = getCustomRepositoryEntity(entities);

    EntitiesMetadataStorage.addEntitiesByConnection(connection, [
      ...entities,
      ...customRepositoryEntities,
    ]);

    return {
      module: LazyTypeOrmModule,
      providers: providers,
      exports: providers,
    };
  }
}
