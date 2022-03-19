import { EntitiesMetadataStorage } from '@nestjs/typeorm/dist/entities-metadata.storage';
import { TYPEORM_MODULE_OPTIONS } from '@nestjs/typeorm/dist/typeorm.constants';
import { map, Observable, Subject } from 'rxjs';
import { ModuleRef } from '@nestjs/core';
import {
  TypeOrmConnectionFactory,
  getEntityManagerToken,
  TypeOrmModuleOptions,
  getConnectionToken,
  getConnectionName,
} from '@nestjs/typeorm';
import {
  DynamicModule,
  Provider,
  Global,
  Inject,
  Logger,
  Module,
  Type,
} from '@nestjs/common';
import {
  getConnectionManager,
  ConnectionOptions,
  createConnection,
  Connection,
} from 'typeorm';

@Global()
@Module({})
export class LazyTypeOrmCoreModule {
  private static readonly logger = new Logger('LazyTypeOrmCoreModule');
  private static globalConnection = new Subject<Connection | undefined>();

  constructor(
    @Inject(TYPEORM_MODULE_OPTIONS)
    private readonly options: TypeOrmModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(options: TypeOrmModuleOptions = {}): DynamicModule {
    const connectionProvider = {
      provide: getConnectionToken(options as ConnectionOptions) as string,
      useFactory: async () => {
        const firstConnection = await this.createLazyConnection(options);

        return new Observable((subscriber) => {
          if (firstConnection) {
            subscriber.next(firstConnection);
            subscriber.complete();
            return;
          }

          this.globalConnection.subscribe((connection) => {
            if (connection) {
              subscriber.next(connection);
              subscriber.complete();
            }
          });
        });
      },
    };

    const entityManagerProvider = this.createEntityManagerProvider(
      options as ConnectionOptions,
    );

    return {
      module: LazyTypeOrmCoreModule,
      providers: [
        entityManagerProvider,
        connectionProvider,
        {
          provide: TYPEORM_MODULE_OPTIONS,
          useValue: options,
        },
      ],
      exports: [entityManagerProvider, connectionProvider],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.options.keepConnectionAlive) {
      return;
    }

    try {
      const connection = this.moduleRef.get<Connection>(
        getConnectionToken(
          this.options as ConnectionOptions,
        ) as Type<Connection>,
      );

      connection && (await connection.close());
    } catch (e) {
      LazyTypeOrmCoreModule.logger.error(e?.message);
    }
  }

  private static createEntityManagerProvider(
    options: ConnectionOptions,
  ): Provider {
    return {
      provide: getEntityManagerToken(options) as string,
      useFactory: (connectionObservable: Observable<Connection>) => {
        return connectionObservable.pipe(
          map((connection: Connection) => {
            return connection.manager;
          }),
        );
      },
      inject: [getConnectionToken(options)],
    };
  }

  private static async createLazyConnection(
    options: TypeOrmModuleOptions,
  ): Promise<Connection | undefined> {
    const firstConnection = await this.createConnectionFactory(options);

    if (!firstConnection) {
      const retryDelay = options.retryDelay ?? 5000;
      const body = async () => {
        const connection = await this.createConnectionFactory(options);
        if (!connection) {
          setTimeout(body, retryDelay);
          return;
        }

        this.logger.log('Connected to database');
        this.globalConnection.next(connection);
      };

      setTimeout(body, retryDelay);
      return;
    }

    this.logger.log('Connected to database');
    return firstConnection;
  }

  private static async createConnectionFactory(
    options: TypeOrmModuleOptions,
    connectionFactory?: TypeOrmConnectionFactory,
  ): Promise<Connection | undefined> {
    try {
      const connectionToken = getConnectionName(options as ConnectionOptions);
      const createTypeormConnection = connectionFactory ?? createConnection;

      try {
        if (options.keepConnectionAlive) {
          const connectionName = getConnectionName(
            options as ConnectionOptions,
          );
          const manager = getConnectionManager();

          if (manager.has(connectionName)) {
            const connection = manager.get(connectionName);

            if (connection.isConnected) {
              return connection;
            }
          }
        }
      } catch {}

      if (!options.type) {
        return createTypeormConnection();
      }

      if (!options.autoLoadEntities) {
        return createTypeormConnection(options as ConnectionOptions);
      }

      let entities = options.entities;

      if (entities) {
        entities = entities.concat(
          EntitiesMetadataStorage.getEntitiesByConnection(connectionToken),
        );
      } else {
        entities =
          EntitiesMetadataStorage.getEntitiesByConnection(connectionToken);
      }

      return await createTypeormConnection({
        ...options,
        entities,
      } as ConnectionOptions);
    } catch (error) {
      if (!error.message.includes('ECONNREFUSED')) {
        this.logger.error(error.message);
      }
    }
  }
}
