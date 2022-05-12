import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Observable } from 'rxjs';

import { AppService } from './app/app.service';

describe('AppController with no database connection (e2e)', () => {
  let app: INestApplication;
  let appService: {
    firstRepository: unknown;
    secondRepository: unknown;
  };

  beforeAll(async () => {
    process.env.NODE_TEST_DB_TYPE = 'postgres'; // sqlite

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

  it('/:id (GET) and expect to fail', () => {
    expect(appService.firstRepository instanceof Observable).toBe(true);
    expect(appService.secondRepository instanceof Observable).toBe(true);
    return request(app.getHttpServer())
      .get('/10')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
  });
});
