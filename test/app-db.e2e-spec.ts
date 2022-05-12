import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { AppService } from './app/app.service';
import { SecondRepository } from './app/second.repository';

describe('AppController with a database connection (e2e)', () => {
  let app: INestApplication;
  let appService: {
    firstRepository: unknown;
    secondRepository: unknown;
  };

  beforeAll(async () => {
    process.env.NODE_TEST_DB_TYPE = 'sqlite';

    const { AppModule } = await import('./app/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    appService = app.get(AppService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/:id (GET) and receive empty object', () => {
    expect(appService.firstRepository instanceof Repository).toBe(true);
    expect(appService.secondRepository instanceof SecondRepository).toBe(true);
    return request(app.getHttpServer())
      .get('/10')
      .expect(HttpStatus.OK)
      .expect({});
  });
});
