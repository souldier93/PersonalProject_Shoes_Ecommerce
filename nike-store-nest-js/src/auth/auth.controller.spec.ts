// auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller'; // ✅ Đổi từ AuthController thành UsersController

describe('UsersController', () => { // ✅ Đổi tên
  let controller: AuthController; // ✅ Đổi type

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController], // ✅ Đổi tên
    }).compile();

    controller = module.get<AuthController>(AuthController); // ✅ Đổi tên
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
