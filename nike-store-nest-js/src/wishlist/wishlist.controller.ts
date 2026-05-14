import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('user/:userId')
  getUserWishlist(@Param('userId') userId: string) {
    return this.wishlistService.getUserWishlist(userId);
  }

  @Post()
  addItem(@Body() body: any) {
    return this.wishlistService.addItem(body);
  }

  @Delete(':id')
  removeItem(@Param('id') id: string) {
    return this.wishlistService.removeItem(id);
  }

  @Delete('user/:userId/product/:productId')
  removeByProduct(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeByProduct(userId, productId);
  }
}
