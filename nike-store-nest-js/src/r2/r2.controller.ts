import { Controller, Get, Query } from '@nestjs/common';
import { R2Service } from './r2.service';

@Controller('r2')
export class R2Controller {
  constructor(private readonly r2Service: R2Service) {}

  // GET /r2/folders - Lấy danh sách product folders - GIỮ NGUYÊN
  @Get('folders')
  async getFolders() {
    return this.r2Service.listFolders();
  }

  // GET /r2/subfolders?folder=Air Jordan 1 Mid - GIỮ NGUYÊN
  @Get('subfolders')
  async getSubfolders(@Query('folder') folder: string) {
    if (!folder) {
      return { error: 'Folder parameter is required' };
    }
    return this.r2Service.listSubfolders(folder);
  }

  // ✅ THÊM MỚI: GET /r2/media - Lấy cả images VÀ videos
  @Get('media')
  async getMedia(
    @Query('folder') folder: string,
    @Query('subfolder') subfolder?: string
  ) {
    if (!folder) {
      return { error: 'Folder parameter is required' };
    }
    return this.r2Service.listMedia(folder, subfolder);
  }

  // GIỮ NGUYÊN endpoint images cũ (để backward compatibility)
  @Get('images')
  async getImages(
    @Query('folder') folder: string,
    @Query('subfolder') subfolder?: string
  ) {
    if (!folder) {
      return { error: 'Folder parameter is required' };
    }
    return this.r2Service.listImages(folder, subfolder);
  }

  // GET /r2/generate-urls - GIỮ NGUYÊN
  @Get('generate-urls')
  async generateUrls(
    @Query('productSlug') productSlug: string,
    @Query('styleCode') styleCode: string,
    @Query('colorName') colorName: string,
    @Query('count') count: string,
  ) {
    return this.r2Service.generateColorImageUrls(
      productSlug,
      styleCode,
      colorName,
      parseInt(count),
    );
  }
}
