import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShoeDetailDocument = ShoeDetail & Document;

@Schema({ 
  collection: 'shoesDetail', 
  timestamps: false,
  versionKey: false 
})
export class ShoeDetail {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Number, required: true })
  price: number;

  // Array colors - Má»–I COLOR CÃ“ Äáº¦Y Äá»¦ Táº¤T Cáº¢ THÃ”NG TIN
  @Prop({
    type: [{
      colorName: String,
      hex: String,
      thumbnail: String,
      images: [String],
      sizes: [{
        size: String,
        stock: Number
      }],
      styleCode: String,
      category: String,
      createdAt: String,
      description: String,
      materialNote: String,
      origin: String,
      rating: Number,
      reviewCount: Number,
      updatedAt: String,
      price: Number
    }],
    default: []
  })
  colors: {
    colorName: string;
    hex: string;
    thumbnail: string;
    images: string[];
    sizes: { size: string; stock: number }[];
    styleCode: string;
    category: string;
    createdAt: string;
    description: string;
    materialNote: string;
    origin: string;
    rating: number;
    reviewCount: number;
    updatedAt: string;
    price: number;
  }[];
}

export const ShoeDetailSchema = SchemaFactory.createForClass(ShoeDetail);