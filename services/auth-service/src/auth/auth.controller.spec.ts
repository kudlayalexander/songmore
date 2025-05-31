import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@songmore/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    _id: 'some-id',
    email: 'test@example.com',
    username: 'testuser',
    roles: [Role.USER],
    isActive: true,
  };

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const loginDto = { email: 'test@example.com', password: 'testpass' };
      const expectedResponse = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should return access token and user data for new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpass',
      };
      const expectedResponse = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile from request object', () => {
      const req = { user: mockUser };
      const result = controller.getProfile(req);
      expect(result).toEqual(mockUser);
    });
  });
}); 