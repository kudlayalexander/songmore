import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/enums/role.enum';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let mongoServer: MongoMemoryServer;
  let jwtToken: string;
  let moduleFixture: TestingModule;

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'testpass123',
  };

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
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

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

  describe('Authentication', () => {
    describe('/auth/register (POST)', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body.access_token).toBeDefined();
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.username).toBe(testUser.username);
            expect(res.body.user.password).toBeUndefined();
            expect(res.body.user.roles).toContain(Role.USER);
          });
      });

      it('should fail to register with existing email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409);
      });

      it('should fail to register with invalid data', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'invalid-email',
            password: 'short',
          })
          .expect(400);
      });
    });

    describe('/auth/login (POST)', () => {
      it('should login with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.access_token).toBeDefined();
            expect(res.body.user).toBeDefined();
            jwtToken = res.body.access_token;
          });
      });

      it('should fail to login with invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401);
      });
    });

    describe('/auth/profile (GET)', () => {
      it('should get user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.userId).toBeDefined();
            expect(res.body.email).toBe(testUser.email);
            expect(res.body.roles).toBeDefined();
          });
      });

      it('should fail to get profile without token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should fail to get profile with invalid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });
}); 