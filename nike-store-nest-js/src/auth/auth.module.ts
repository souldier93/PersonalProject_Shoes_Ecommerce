// auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { UsersService } from './auth.service';
import { EmailService } from './email.service'; // ✅ Import EmailService
import { User, UserSchema } from './user.schema';
import { Role, RoleSchema } from './role.schema';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        
        console.log('🔑 JWT_SECRET loaded:', secret ? '✅ Yes' : '❌ No');
        console.log('🔑 JWT_SECRET length:', secret?.length || 0);
        
        return {
          secret: secret || 'fallback-secret-key',
          signOptions: { expiresIn: '24h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [UsersService, EmailService, JwtStrategy], // ✅ Add EmailService
  exports: [UsersService],
})
export class AuthModule {}