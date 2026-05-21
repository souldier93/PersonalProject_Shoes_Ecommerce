import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatConversation } from './chat.schema';
import { ShoeDetail } from '../shoes/shoe-detail.schema';

jest.mock('axios');

function queryMock<T>(value: T) {
  return {
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe('ChatService AI replies', () => {
  let service: ChatService;
  let shoeDetailModel: any;

  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    shoeDetailModel = {
      find: jest.fn().mockReturnValue(queryMock([])),
    };

    mockedAxios.post.mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    text: 'Hom nay la ngay hien tai trong he thong.',
                    needsManager: false,
                    meta: { intent: 'fallback' },
                  }),
                },
              ],
            },
          },
        ],
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(ChatConversation.name), useValue: {} },
        { provide: getModelToken(ShoeDetail.name), useValue: shoeDetailModel },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
              if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends current Vietnam time context to Gemini for date questions', async () => {
    await (service as any).buildBotReply('Hom nay la ngay bao nhieu?', []);

    const [, body] = mockedAxios.post.mock.calls[0];
    const prompt = body.contents[0].parts[0].text;

    expect(prompt).toContain('THOI GIAN HE THONG HIEN TAI');
    expect(prompt).toContain('Asia/Ho_Chi_Minh');
    expect(prompt).toContain('Hom nay la ngay bao nhieu?');
  });
});
