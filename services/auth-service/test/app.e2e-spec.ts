import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let moduleFixture: TestingModule;
  let mongoConnection: Connection;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'mongodb.uri') return mongoUri;
          if (key === 'jwt.secret') return 'test-secret';
          if (key === 'jwt.expiresIn') return '1h';
          return process.env[key];
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    await app.init();
  }, 30000);

  afterAll(async () => {
    try {
      await mongoConnection.dropDatabase();
      await Promise.all([
        mongoConnection.close(true),
        app.close(),
        moduleFixture.close(),
        mongoServer.stop()
      ]);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 30000);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  }, 10000);
});
