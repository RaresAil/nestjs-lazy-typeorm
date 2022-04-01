import { ConnectionOptions } from 'typeorm';

export type TypeOrmModuleOptions = {
  /**
   * Delay between connection retry attempts (ms)
   * Default: 5000
   */
  retryDelay?: number;
  /**
   * If `true`, entities will be loaded automatically.
   */
  autoLoadEntities?: boolean;
  /**
   * If `true`, connection will not be closed on application shutdown.
   */
  keepConnectionAlive?: boolean;
  /**
   * If `true`, will show verbose error messages on each connection retry.
   */
  verboseRetryLog?: boolean;
} & Partial<ConnectionOptions>;
