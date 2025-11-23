import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ShoesModule } from './shoes/shoes.module';
import { ConfigModule } from '@nestjs/config';
import { R2Module } from './r2/r2.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Làm cho ConfigService có thể dùng ở mọi nơi
      envFilePath: '.env',
    }),
    R2Module,
    MongooseModule.forRoot('mongodb://localhost:27017/nike-store'),
    ShoesModule,
    AuthModule,

  ],
})
export class AppModule {}
