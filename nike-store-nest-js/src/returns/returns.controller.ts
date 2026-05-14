import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@Body() body: any) {
    return this.returnsService.create(body);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.returnsService.findAll(status);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.returnsService.findByUser(userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('adminNote') adminNote?: string,
  ) {
    return this.returnsService.updateStatus(id, status, adminNote);
  }
}
