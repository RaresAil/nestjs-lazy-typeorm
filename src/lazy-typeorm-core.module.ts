import { EntitiesMetadataStorage } from '@nestjs/typeorm/dist/entities-metadata.storage';
import { TYPEORM_MODULE_OPTIONS } from '@nestjs/typeorm/dist/typeorm.constants';
import { map, Observable, Subject } from 'rxjs';
import {
  TypeOrmConnectionFactory,
  getEntityManagerToken,
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
} from '@nestjs/common';
import {
  getConnectionManager,
  ConnectionOptions,
  createConnection,
  Connection,
  EntityManager,
} from 'typeorm';

import { TypeOrmModuleOptions } from './lazy-typeorm.interface';

@Global()
@Module({})
export class LazyTypeOrmCoreModule {
  private static readonly logger = new Logger('LazyTypeOrmCoreModule');
  private static connectionSubjects: {
    [key: string]: Subject<Connection>;
  } = {};
  private static connections: {
    [key: string]: Connection;
  } = {};

  constructor(
    @Inject(TYPEORM_MODULE_OPTIONS)
    private readonly options: TypeOrmModuleOptions,
  ) {}

  static forRoot(options: TypeOrmModuleOptions = {}): DynamicModule {
    const connectionToken = getConnectionToken(
      options as ConnectionOptions,
    ) as string;

    this.connectionSubjects[connectionToken] = new Subject<Connection>();

    const connectionProvider = {
      provide: connectionToken,
      useFactory: async (): Promise<Observable<Connection>> => {
        const firstConnection = await this.createLazyConnection(options);

        return new Observable((subscriber) => {
          if (firstConnection) {
            this.connections[connectionToken] = firstConnection;
            subscriber.next(firstConnection);
            subscriber.complete();
            return;
          }

          this.connectionSubjects[connectionToken].subscribe((connection) => {
            if (connection) {
              this.connections[connectionToken] = connection;
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
      const connectionToken = getConnectionToken(
        this.options as ConnectionOptions,
      ) as string;

      await LazyTypeOrmCoreModule.connections[connectionToken]?.close();
    } catch (e) {
      LazyTypeOrmCoreModule.logger.error(e?.message);
    }
  }

  private static createEntityManagerProvider(
    options: ConnectionOptions,
  ): Provider {
    return {
      provide: getEntityManagerToken(options) as string,
      useFactory: (
        connectionObservable: Observable<Connection>,
      ): Observable<EntityManager> => {
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
    const connectionToken = getConnectionToken(
      options as ConnectionOptions,
    ) as string;

    const firstConnection = await this.createConnectionFactory(options);

    if (!firstConnection) {
      const retryDelay = options.retryDelay ?? 5000;
      const body = async (): Promise<void> => {
        const connection = await this.createConnectionFactory(options);
        if (!connection) {
          setTimeout(body, retryDelay);
          return;
        }

        this.logger.log('Connected to database');
        this.connectionSubjects[connectionToken].next(connection);
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
      } catch (error) {
        if (options.verboseRetryLog) {
          this.logger.error(error.message);
        }
      }

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
      if (options.verboseRetryLog) {
        this.logger.error(error.message);
      }
    }
  }
}
