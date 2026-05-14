import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ShoesModule } from './shoes/shoes.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { R2Module } from './r2/r2.module';
import { PaymentModule } from './payment/payment.module';
import { CouponsModule } from './coupons/coupons.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReturnsModule } from './returns/returns.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path'; // ✅ Import
import { ServeStaticModule } from '@nestjs/serve-static'; // ✅ Import
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Làm cho ConfigService có thể dùng ở mọi nơi
      envFilePath: '.env',
    }),
    R2Module,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/nike-store';

        return {
          uri,
          dbName: configService.get<string>('MONGO_DB_NAME') || 'nike-store',
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/', // Files sẽ được serve tại root path
    }),
    ShoesModule,
    AuthModule,
    ScheduleModule.forRoot(),
    PaymentModule,
    CouponsModule,
    AnalyticsModule,
    InventoryModule,
    ReturnsModule,
    ReviewsModule,
    WishlistModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
