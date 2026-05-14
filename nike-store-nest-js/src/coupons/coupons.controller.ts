import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @Get('validate')
  validate(@Query('code') code: string, @Query('amount') amount: string) {
    return this.couponsService.validate(code, Number(amount || 0));
  }
}
