import { Body, Controller, Get, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('overview')
  getOverview() {
    return this.inventoryService.getOverview();
  }

  @Post('adjust')
  adjustStock(@Body() body: any) {
    return this.inventoryService.adjustStock(body);
  }
}
