import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShoesController } from './shoes.controller';
import { ShoesService } from './shoes.service';
import { Shoe, ShoeSchema } from './shoes.schema';
import { ShoeDetail, ShoeDetailSchema } from './shoe-detail.schema';
import { Counter, CounterSchema } from './counter.schema'; // THÃŠM

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shoe.name, schema: ShoeSchema },
      { name: ShoeDetail.name, schema: ShoeDetailSchema },
      { name: Counter.name, schema: CounterSchema }, // THÃŠM
    ]),
  ],
  controllers: [ShoesController],
  providers: [ShoesService],
})
export class ShoesModule {}