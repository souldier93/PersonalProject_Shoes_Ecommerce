import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatConversation,
  ChatConversationDocument,
} from './chat.schema';
import { ShoeDetail, ShoeDetailDocument } from '../shoes/shoe-detail.schema';

type SenderType = 'user' | 'manager' | 'bot';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name)
    private chatModel: Model<ChatConversationDocument>,
    @InjectModel(ShoeDetail.name)
    private shoeDetailModel: Model<ShoeDetailDocument>,
  ) {}

  async createOrGetConversation(body: {
    userId?: string;
    guestId?: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    const userId = body.userId || '';
    const guestId = body.guestId || '';

    const identityQuery = userId ? { userId } : { guestId };
    let conversation = await this.chatModel
      .findOne({ ...identityQuery, status: { $ne: 'resolved' } })
      .sort({ updatedAt: -1 })
      .exec();

    if (conversation) {
      const updateData: any = {};
      if (body.customerName) updateData.customerName = body.customerName;
      if (body.customerEmail) updateData.customerEmail = body.customerEmail;

      if (Object.keys(updateData).length) {
        conversation = await this.chatModel
          .findByIdAndUpdate(conversation._id, { $set: updateData }, { new: true })
          .exec();
      }

      return conversation;
    }

    return this.chatModel.create({
      userId,
      guestId,
      customerName: body.customerName || (userId ? 'Member' : 'Guest'),
      customerEmail: body.customerEmail || '',
      status: 'open',
      lastMessage: 'Xin chào! Mình có thể hỗ trợ size, tồn kho, đơn hàng, đổi trả hoặc kết nối quản lý cho bạn.',
      unreadForCustomer: 1,
      messages: [
        {
          senderType: 'bot',
          senderName: 'Store Assistant',
          text: 'Xin chào! Mình có thể hỗ trợ size, tồn kho, đơn hàng, đổi trả hoặc kết nối quản lý cho bạn.',
          createdAt: new Date(),
          meta: { quickReplies: ['Tư vấn size', 'Kiểm tra tồn kho', 'Gặp quản lý'] },
        },
      ],
    });
  }

  async listConversations(query: {
    status?: string;
    userId?: string;
    guestId?: string;
  }) {
    const filter: any = {};
    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.userId) filter.userId = query.userId;
    if (query.guestId) filter.guestId = query.guestId;

    return this.chatModel
      .find(filter)
      .sort({ status: 1, updatedAt: -1 })
      .lean()
      .exec();
  }

  async getConversation(id: string) {
    const conversation = await this.chatModel.findById(id).lean().exec();
    if (!conversation) {
      throw new NotFoundException(`Conversation "${id}" not found`);
    }
    return conversation;
  }

  async addMessage(
    id: string,
    body: {
      senderType?: SenderType;
      senderName?: string;
      text: string;
      botEnabled?: boolean;
    },
  ) {
    const conversation = await this.chatModel.findById(id).exec();
    if (!conversation) {
      throw new NotFoundException(`Conversation "${id}" not found`);
    }

    const senderType = body.senderType || 'user';
    const text = String(body.text || '').trim();
    if (!text) return conversation;

    conversation.messages.push({
      senderType,
      senderName: body.senderName || this.defaultSenderName(senderType),
      text,
      createdAt: new Date(),
    });
    conversation.lastMessage = text;

    if (senderType === 'manager') {
      conversation.status = 'open';
      conversation.unreadForCustomer = (conversation.unreadForCustomer || 0) + 1;
      conversation.unreadForManager = 0;
    } else if (senderType === 'user') {
      conversation.unreadForManager = (conversation.unreadForManager || 0) + 1;
      conversation.unreadForCustomer = 0;
    }

    if (senderType === 'user' && body.botEnabled !== false) {
      const botReply = await this.buildBotReply(text);
      conversation.messages.push({
        senderType: 'bot',
        senderName: 'Store Assistant',
        text: botReply.text,
        createdAt: new Date(),
        meta: botReply.meta,
      });
      conversation.lastMessage = botReply.text;
      conversation.unreadForCustomer = (conversation.unreadForCustomer || 0) + 1;

      if (botReply.needsManager) {
        conversation.status = 'pending_manager';
      }
    }

    return conversation.save();
  }

  async updateStatus(
    id: string,
    body: { status?: string; assignedTo?: string },
  ) {
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;

    const conversation = await this.chatModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!conversation) {
      throw new NotFoundException(`Conversation "${id}" not found`);
    }

    return conversation;
  }

  async markRead(id: string, target: 'customer' | 'manager') {
    const updateData =
      target === 'manager'
        ? { unreadForManager: 0 }
        : { unreadForCustomer: 0 };

    const conversation = await this.chatModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!conversation) {
      throw new NotFoundException(`Conversation "${id}" not found`);
    }

    return conversation;
  }

  private defaultSenderName(senderType: SenderType) {
    if (senderType === 'manager') return 'Store Manager';
    if (senderType === 'bot') return 'Store Assistant';
    return 'Customer';
  }

  private async buildBotReply(text: string) {
    const normalized = this.normalize(text);

    if (this.hasAny(normalized, ['quan ly', 'nhan vien', 'nguoi that', 'tu van vien', 'support', 'admin', 'gap nguoi'])) {
      return {
        text: 'Mình đã chuyển cuộc trò chuyện này sang quản lý. Trong lúc chờ phản hồi, bạn cứ gửi thêm mã đơn, tên sản phẩm hoặc vấn đề đang gặp để quản lý nắm nhanh hơn nhé.',
        needsManager: true,
        meta: { intent: 'manager' },
      };
    }

    if (this.hasAny(normalized, ['ton kho', 'con hang', 'het hang', 'stock', 'size', 'mau nao', 'mau gi'])) {
      const productAnswer = await this.answerProductQuestion(text);
      if (productAnswer) return productAnswer;

      return {
        text: 'Bạn gửi giúp mình tên sản phẩm, màu hoặc size cần kiểm tra nhé. Ví dụ: "Pegasus 41 size 42 còn hàng không?"',
        needsManager: false,
        meta: { intent: 'stock' },
      };
    }

    if (this.hasAny(normalized, ['doi tra', 'tra hang', 'hoan tien', 'bao hanh', 'return', 'refund'])) {
      return {
        text: 'Bạn có thể gửi yêu cầu đổi trả từ mục đơn hàng. Với sản phẩm lỗi, sai size hoặc giao nhầm, quản lý sẽ kiểm tra mã đơn và phản hồi hướng xử lý. Bạn gửi mã đơn tại đây, mình sẽ chuyển tiếp cho quản lý.',
        needsManager: true,
        meta: { intent: 'return' },
      };
    }

    if (this.hasAny(normalized, ['don hang', 'ma don', 'giao hang', 'van chuyen', 'tracking', 'ship'])) {
      return {
        text: 'Nếu bạn đã đăng nhập, hãy vào My Orders để xem trạng thái đơn. Nếu mua dạng guest, bạn gửi email hoặc mã đơn, quản lý sẽ hỗ trợ tra cứu. Thời gian giao thường phụ thuộc địa chỉ và trạng thái thanh toán.',
        needsManager: false,
        meta: { intent: 'order' },
      };
    }

    if (this.hasAny(normalized, ['giam gia', 'voucher', 'coupon', 'khuyen mai', 'sale'])) {
      return {
        text: 'Mã giảm giá sẽ được nhập ở bước checkout nếu đang có hiệu lực. Bạn có thể gửi ngân sách hoặc sản phẩm đang xem, mình sẽ gợi ý nhóm hàng phù hợp hơn.',
        needsManager: false,
        meta: { intent: 'coupon' },
      };
    }

    if (this.hasAny(normalized, ['chao', 'hello', 'hi', 'xin chao'])) {
      return {
        text: 'Chào bạn! Bạn muốn mình tư vấn size, kiểm tra tồn kho, gợi ý sản phẩm hay kết nối quản lý?',
        needsManager: false,
        meta: { intent: 'greeting', quickReplies: ['Tư vấn size', 'Kiểm tra tồn kho', 'Gặp quản lý'] },
      };
    }

    return {
      text: 'Mình có thể hỗ trợ nhanh về size, tồn kho, đơn hàng, đổi trả và mã giảm giá. Nếu bạn muốn gặp quản lý, hãy nhắn "gặp quản lý" nhé.',
      needsManager: false,
      meta: { intent: 'fallback' },
    };
  }

  private async answerProductQuestion(text: string) {
    const normalized = this.normalize(text);
    const keywords = normalized
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !this.stopWords().has(word))
      .slice(0, 8);

    if (!keywords.length) return null;

    const products = await this.shoeDetailModel.find().lean().exec();
    const scored = products
      .map((product) => {
        const haystack = this.normalize(
          [
            product.name,
            product.category,
            product.productType,
            product.collection,
            ...(product.colors || []).map((color) => color.colorName),
          ].join(' '),
        );
        const score = keywords.filter((word) => haystack.includes(word)).length;
        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!scored.length) return null;

    const lines = scored.map(({ product }) => {
      const colors = product.colors || [];
      const totalStock = colors.reduce((sum, color) => {
        return sum + (color.sizes || []).reduce((sizeSum, size) => sizeSum + Number(size.stock || 0), 0);
      }, 0);
      const availableSizes = Array.from(
        new Set(
          colors.flatMap((color) =>
            (color.sizes || [])
              .filter((size) => Number(size.stock || 0) > 0)
              .map((size) => size.size),
          ),
        ),
      ).slice(0, 8);
      return `- ${product.name}: còn khoảng ${totalStock} sản phẩm, size còn: ${availableSizes.join(', ') || 'đang cập nhật'}`;
    });

    return {
      text: `Mình tìm thấy vài sản phẩm phù hợp:\n${lines.join('\n')}\nBạn gửi thêm màu/size cụ thể để mình kiểm tra sát hơn nhé.`,
      needsManager: false,
      meta: { intent: 'product_lookup' },
    };
  }

  private normalize(value: string) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  private hasAny(value: string, patterns: string[]) {
    return patterns.some((pattern) => value.includes(pattern));
  }

  private stopWords() {
    return new Set([
      'cho',
      'toi',
      'minh',
      'ban',
      'con',
      'hang',
      'khong',
      'size',
      'mau',
      'kiem',
      'tra',
      'san',
      'pham',
    ]);
  }
}
