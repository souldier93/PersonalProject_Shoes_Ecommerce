import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShoeDocument = Shoe & Document;

@Schema({ 
  collection: 'shoes', 
  timestamps: false,  // Táº®T timestamps
  versionKey: false   // Táº®T __v
})
export class Shoe {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ required: true })
  color: string;

  @Prop()
  thumbnail: string;
}

export const ShoeSchema = SchemaFactory.createForClass(Shoe);