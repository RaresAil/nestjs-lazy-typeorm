import { Module } from '@nestjs/common';

// MODULE
import { LazyTypeOrmModule, TypeOrmModuleOptions } from '../../src';

// TEST FILES
import { SecondRepository } from './second.repository';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { First } from './first.entity';

@Module({
  imports: [
    LazyTypeOrmModule.forRoot({
      type: process.env.NODE_TEST_DB_TYPE as 'sqlite' | 'postgres',
      database: ':memory:',
      autoLoadEntities: true,
      verboseRetryLog: process.env.NODE_TEST_LOGS === 'true',
      synchronize: true,
    }),
    LazyTypeOrmModule.forFeature([First, SecondRepository]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
