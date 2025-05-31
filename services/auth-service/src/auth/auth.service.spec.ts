import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '@songmore/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    _id: 'some-id',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    roles: [Role.USER],
    isActive: true,
    toJSON: () => ({
      _id: 'some-id',
      email: 'test@example.com',
      username: 'testuser',
      roles: [Role.USER],
      isActive: true,
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'signed-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      const password = 'testpass';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, password: hashedPassword };
      
      mockUsersService.findByEmail.mockResolvedValue(userWithHash);
      
      const result = await service.validateUser('test@example.com', password);
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      const result = await service.validateUser('test@example.com', 'testpass');
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      
      const result = await service.validateUser('test@example.com', 'wrongpass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user when credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'testpass' };
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpass' };
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should create a new user and return access token', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpass',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });
}); 