import { Module } from '@nestjs/common';

import { LazyTypeOrmModule } from './lazy-typeorm/lazy-typeorm.module';
import { SecondDemoRepository } from './second-demo.repository';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Demo } from './demo.entity';

@Module({
  imports: [
    LazyTypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '',
      database: 'lazy',
      autoLoadEntities: true,
      synchronize: true,
    }),
    LazyTypeOrmModule.forFeature([Demo, SecondDemoRepository]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
