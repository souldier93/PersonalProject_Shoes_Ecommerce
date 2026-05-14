import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShoeDetail, ShoeDetailSchema } from '../shoes/shoe-detail.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovement, StockMovementSchema } from './stock-movement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShoeDetail.name, schema: ShoeDetailSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
