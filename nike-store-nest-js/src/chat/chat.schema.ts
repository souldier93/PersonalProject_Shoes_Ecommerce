import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatConversationDocument = ChatConversation & Document;

@Schema({
  collection: 'chatConversations',
  timestamps: true,
})
export class ChatConversation {
  @Prop({ default: '' })
  userId: string;

  @Prop({ default: '' })
  guestId: string;

  @Prop({ default: 'Guest' })
  customerName: string;

  @Prop({ default: '' })
  customerEmail: string;

  @Prop({ enum: ['open', 'pending_manager', 'resolved'], default: 'open' })
  status: string;

  @Prop({ default: '' })
  assignedTo: string;

  @Prop({ default: '' })
  lastMessage: string;

  @Prop({ default: 0 })
  unreadForManager: number;

  @Prop({ default: 0 })
  unreadForCustomer: number;

  @Prop({
    type: [
      {
        senderType: {
          type: String,
          enum: ['user', 'manager', 'bot'],
          default: 'user',
        },
        senderName: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
        meta: Object,
      },
    ],
    default: [],
  })
  messages: Array<{
    senderType: 'user' | 'manager' | 'bot';
    senderName: string;
    text: string;
    createdAt: Date;
    meta?: Record<string, any>;
  }>;
}

export const ChatConversationSchema =
  SchemaFactory.createForClass(ChatConversation);

ChatConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
ChatConversationSchema.index({ guestId: 1, status: 1, updatedAt: -1 });
ChatConversationSchema.index({ status: 1, updatedAt: -1 });
