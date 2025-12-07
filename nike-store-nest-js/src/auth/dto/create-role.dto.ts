// create-role.dto.ts
import { 
  IsString, 
  IsArray, 
  IsOptional, 
  ArrayNotEmpty, 
  ArrayMinSize 
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' }) // ✅ Thêm validation
  @IsString({ each: true })
  permissions: string[];
}
