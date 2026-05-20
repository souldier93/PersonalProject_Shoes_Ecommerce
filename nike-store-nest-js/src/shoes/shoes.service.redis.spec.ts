import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ShoesService } from './shoes.service';
import { Shoe } from './shoes.schema';
import { ShoeDetail } from './shoe-detail.schema';
import { Counter } from './counter.schema';
import { RedisCacheService } from '../redis/redis-cache.service';

function queryMock<T>(value: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe('ShoesService Redis cache', () => {
  let service: ShoesService;
  let shoeModel: any;
  let shoeDetailModel: any;
  let redisCache: any;

  beforeEach(async () => {
    shoeModel = {
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    shoeDetailModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    redisCache = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoesService,
        { provide: getModelToken(Shoe.name), useValue: shoeModel },
        { provide: getModelToken(ShoeDetail.name), useValue: shoeDetailModel },
        { provide: getModelToken(Counter.name), useValue: {} },
        { provide: getModelToken('Bill'), useValue: {} },
        { provide: RedisCacheService, useValue: redisCache },
      ],
    }).compile();

    service = module.get<ShoesService>(ShoesService);
  });

  it('returns cached product listings without querying MongoDB', async () => {
    const cachedProducts = [{ productId: '1', name: 'Cached Shoe', stock: 8 }];
    redisCache.getJson.mockResolvedValue(cachedProducts);

    await expect(service.findAll()).resolves.toEqual(cachedProducts);

    expect(redisCache.getJson).toHaveBeenCalledWith('shoes:list:all');
    expect(shoeModel.find).not.toHaveBeenCalled();
    expect(redisCache.setJson).not.toHaveBeenCalled();
  });

  it('caches product listings after querying MongoDB', async () => {
    shoeModel.find.mockReturnValue(
      queryMock([
        {
          productId: '1',
          name: 'Nike Air',
          category: 'men',
          productType: 'sneaker',
          collection: 'air',
          price: 120,
          color: 'Black',
          thumbnail: 'thumb.jpg',
        },
      ]),
    );
    shoeDetailModel.findOne.mockReturnValue(
      queryMock({
        productId: '1',
        colors: [{ sizes: [{ size: '42', stock: 3 }] }],
      }),
    );
    redisCache.getJson.mockResolvedValue(null);

    await expect(service.findAll()).resolves.toMatchObject([
      { productId: '1', stock: 3 },
    ]);

    expect(redisCache.setJson).toHaveBeenCalledWith(
      'shoes:list:all',
      expect.any(Array),
      expect.any(Number),
    );
  });

  it('invalidates product cache after updating a shoe', async () => {
    shoeModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    shoeDetailModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ productId: '1' }),
    });

    await service.updateShoe('1', { name: 'Updated Nike' });

    expect(redisCache.delPattern).toHaveBeenCalledWith('shoes:*');
  });
});
