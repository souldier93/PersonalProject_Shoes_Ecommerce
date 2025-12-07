import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ collection: 'role' })
export class Role {
  @Prop({ required: true, unique: true })
  name: string; // 'admin', 'user', 'manager', etc.

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[]; // ['read:products', 'write:orders', etc.]

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
