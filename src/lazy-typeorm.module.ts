import { getCustomRepositoryEntity } from '@nestjs/typeorm/dist/helpers/get-custom-repository-entity';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { EntitiesMetadataStorage } from '@nestjs/typeorm/dist/entities-metadata.storage';
import { DEFAULT_CONNECTION_NAME } from '@nestjs/typeorm/dist/typeorm.constants';
import { Connection, ConnectionOptions } from 'typeorm';
import { DynamicModule, Module } from '@nestjs/common';

import { createLazyTypeOrmProviders } from './lazy-typeorm.provider';
import { LazyTypeOrmCoreModule } from './lazy-typeorm-core.module';
import { TypeOrmModuleOptions } from './lazy-typeorm.interface';

@Module({})
export class LazyTypeOrmModule {
  /**
   * Creates a lazy connection provider.
   *
   * @param options TypeOrmModuleOptions
   * @returns DynamicModule
   */
  static forRoot(options?: TypeOrmModuleOptions): DynamicModule {
    return {
      module: LazyTypeOrmModule,
      imports: [LazyTypeOrmCoreModule.forRoot(options)],
    };
  }

  /**
   * Adds entities to the TypeOrmModule.
   *
   * @param entities EntityClassOrSchema[]
   * @param connection Connection
   * @returns DynamicModule
   */
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
