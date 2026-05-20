import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const usersServiceMock = {
    login: jest.fn(),
    createUser: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateUserRole: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    addAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    getAllRoles: jest.fn(),
    createRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
