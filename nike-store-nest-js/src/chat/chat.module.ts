import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatConversation, ChatConversationSchema } from './chat.schema';
import { ShoeDetail, ShoeDetailSchema } from '../shoes/shoe-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: ShoeDetail.name, schema: ShoeDetailSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
