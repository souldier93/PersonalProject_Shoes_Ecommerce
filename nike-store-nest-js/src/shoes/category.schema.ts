import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ collection: 'categories', timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  _id: string; // 'men', 'women', 'kids'

  @Prop({ required: true })
  title: string; // 'Men', 'Women', 'Kids'

  @Prop({ type: [String], default: [] })
  sections: string[]; // ['Shoes', 'Clothing', 'Accessories']
}

export const CategorySchema = SchemaFactory.createForClass(Category);

