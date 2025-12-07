// create-user.dto.ts
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNumber, 
  Min, 
  MinLength 
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' }) // ✅ Thêm validation
  password: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  roleName: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  age?: number;
}
