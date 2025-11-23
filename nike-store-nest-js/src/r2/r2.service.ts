import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    // Lấy environment variables
    const endpoint = this.configService.get('R2_ENDPOINT');
    const accessKeyId = this.configService.get('R2_ACCESS_KEY');
    const secretAccessKey = this.configService.get('R2_SECRET_KEY');

    // ✅ THÊM DẤU } ĐÓNG BLOCK IF
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required R2 configuration. Please check R2_ENDPOINT, R2_ACCESS_KEY, and R2_SECRET_KEY in .env file'
      );
    } // ✅ DẤU } NÀY BỊ THIẾU!

    // ✅ CODE NÀY PHẢI NẰM NGOÀI BLOCK IF
    this.bucketName = this.configService.get('R2_BUCKET', 'nike-shoes');
    this.publicUrl = this.configService.get(
      'R2_PUBLIC_URL',
      'https://pub-e7f6a07e25ff4108aeb63c55fda4d1aa.r2.dev'
    );

    // Initialize S3Client
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log('✅ R2 Service initialized successfully');
  }

  // List tất cả product folders
  async listFolders(): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Delimiter: '/',
    });
    const response = await this.s3Client.send(command);
    return (
      response.CommonPrefixes?.filter((prefix) => prefix.Prefix !== undefined).map((prefix) =>
        prefix.Prefix!.replace('/', '')
      ) || []
    );
  }

  // ✅ THÊM: List subfolders trong một product folder
  async listSubfolders(folder: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: `${folder}/`,
      Delimiter: '/',
    });
    const response = await this.s3Client.send(command);

    return (
      response.CommonPrefixes?.filter((prefix) => prefix.Prefix !== undefined)
        .map((prefix) => {
          // Remove parent folder and trailing slash
          return prefix.Prefix!.replace(`${folder}/`, '').replace('/', '');
        })
        .filter((name) => name) || []
    );
  }

  // ✅ SỬA: List images hỗ trợ subfolder
  async listImages(folder: string, subfolder?: string): Promise<string[]> {
    const prefix = subfolder ? `${folder}/${subfolder}/` : `${folder}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });
    const response = await this.s3Client.send(command);

    return (
      response.Contents?.filter((item) => {
        if (!item.Key) return false;
        const ext = item.Key.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '');
      }).map((item) => `${this.publicUrl}/${item.Key}`) || []
    );
  }

    // ✅ THÊM MỚI: List cả images VÀ videos
  async listMedia(folder: string, subfolder?: string): Promise<string[]> {
    const prefix = subfolder ? `${folder}/${subfolder}/` : `${folder}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);

    return (
      response.Contents?.filter((item) => {
        if (!item.Key) return false;
        const ext = item.Key.split('.').pop()?.toLowerCase();
        
        // ✅ Hỗ trợ cả image VÀ video formats
        return [
          // Images
          'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp',
          // Videos
          'mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'
        ].includes(ext || '');
      }).map((item) => `${this.publicUrl}/${item.Key}`) || []
    );
  }

  // Generate URLs cho một color cụ thể
  generateColorImageUrls(
    productSlug: string,
    styleCode: string,
    colorName: string,
    imageCount: number
  ): string[] {
    const folderName = `${styleCode}_${colorName.replace(/\s+/g, '_')}`;
    const urls: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const imageNumber = i.toString().padStart(3, '0');
      urls.push(`${this.publicUrl}/${productSlug}/${folderName}/image_${imageNumber}.png`);
    }
    return urls;
  }
}
