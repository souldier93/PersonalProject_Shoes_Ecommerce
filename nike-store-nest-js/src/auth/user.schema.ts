// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document<Types.ObjectId>;

@Schema({ collection: 'users' })
export class User {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop()
  age: number;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  fullName: string;

  @Prop({
    type: [{
      label: String,
      firstName: String,
      lastName: String,
      phone: String,
      address: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      postalCode: String,
      isDefault: Boolean,
    }],
    default: [],
  })
  addresses: {
    label: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    isDefault?: boolean;
  }[];

  @Prop({ default: false }) // ✅ Mặc định chưa xác thực
  isVerified: boolean;

  @Prop() // ✅ Token để xác thực email
  verificationToken: string;

  @Prop() // ✅ Thời gian hết hạn token
  verificationTokenExpires: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
