import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './auth.service'; // ✅ Changed from AuthService to UsersService

describe('UsersService', () => { // ✅ Changed describe name
  let service: UsersService; // ✅ Changed type

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService], // ✅ Changed provider name
    }).compile();

    service = module.get<UsersService>(UsersService); // ✅ Changed to UsersService
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});