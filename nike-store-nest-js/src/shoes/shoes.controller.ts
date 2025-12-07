import { Body, Controller, Get, Param, Post, Delete, Put, Query } from '@nestjs/common';
import { ShoesService } from './shoes.service';

@Controller('shoes')
export class ShoesController {
  constructor(private readonly shoesService: ShoesService) { }

  // ==================== LISTING ROUTES (tá»« collection shoes) ====================

  // GET /shoes?category=men - Danh sÃ¡ch shoes (listing page)
  @Get()
  async getAll(@Query('category') category?: string) {
    if (category) {
      return this.shoesService.findByCategory(category);
    }
    return this.shoesService.findAll();
  }

  // GET /shoes/product/:productId - Láº¥y táº¥t cáº£ mÃ u cá»§a 1 sáº£n pháº©m
  @Get('product/:productId')
  async getByProductId(@Param('productId') productId: string) {
    return this.shoesService.findByProductId(productId);
  }

  // ==================== DETAIL ROUTES (tá»« collection shoesDetail) ====================

  // GET /shoes/detail/:productId - CHI TIáº¾T Äáº¦Y Äá»¦ theo productId
  @Get('detail/:productId')
  async getDetailByProductId(@Param('productId') productId: string) {
    return this.shoesService.findDetailByProductId(productId);
  }

  // GET /shoes/details - Láº¥y táº¥t cáº£ tá»« shoesDetail (náº¿u cáº§n)
  @Get('details')
  async getAllDetails(@Query('category') category?: string) {
    if (category) {
      return this.shoesService.findDetailsByCategory(category);
    }
    return this.shoesService.findAllDetails();
  }

  // ==================== CRUD ====================

  // POST /shoes/product - ThÃªm sáº£n pháº©m má»›i vá»›i nhiá»u mÃ u
  @Post('product')
  async createProduct(@Body() createProductDto: any) {
    // Frontend gá»­i: { name, category, colors: [...] }
    return this.shoesService.createProduct(createProductDto);
  }

  // PUT /shoes/:styleCode - Update shoe
  @Put(':styleCode')
  async updateShoe(@Param('styleCode') styleCode: string, @Body() updateData: any) {
    return this.shoesService.updateShoe(styleCode, updateData);
  }

// POST /shoes/soft-delete/:productId - Soft delete (set stock = 0)
@Post('soft-delete/:productId')
async softDeleteProduct(@Param('productId') productId: string) {
  return this.shoesService.softDeleteProduct(productId);
}

 // ✅ NEW: Check stock for specific color and size
  @Get(':productId/stock/:colorName/:size')
  async checkStock(
    @Param('productId') productId: string,
    @Param('colorName') colorName: string,
    @Param('size') size: string,
  ) {
    return this.shoesService.checkStock(productId, colorName, size);
  }

  // ✅ NEW: Batch check stock for multiple items
  @Post('check-stock-batch')
  async checkStockBatch(@Body() items: Array<{
    productId: string;
    colorName: string;
    size: string;
    quantity: number;
  }>) {
    return this.shoesService.checkStockBatch(items);
  }


 // ✅ DASHBOARD STATS - GỌI SERVICE THAY VÌ TRUY CẬP MODEL
  @Get('stats/dashboard')
  async getDashboardStats() {
    return this.shoesService.getDashboardStats();
  }

}