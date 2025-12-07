import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ShoesModule } from './shoes/shoes.module';
import { ConfigModule } from '@nestjs/config';
import { R2Module } from './r2/r2.module';
import { PaymentModule } from './payment/payment.module';
import { join } from 'path'; // ✅ Import
import { ServeStaticModule } from '@nestjs/serve-static'; // ✅ Import
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Làm cho ConfigService có thể dùng ở mọi nơi
      envFilePath: '.env',
    }),
    R2Module,
    MongooseModule.forRoot('mongodb://localhost:27017/nike-store'),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/', // Files sẽ được serve tại root path
    }),
    ShoesModule,
    AuthModule,
    ScheduleModule.forRoot(),
    PaymentModule
  ],
})
export class AppModule {}
