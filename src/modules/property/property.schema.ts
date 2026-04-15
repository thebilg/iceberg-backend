import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  city!: string;

  @Prop({
    default: 'available',
    enum: ['available', 'in_transaction', 'sold'],
  })
  status!: string;
}

export const PropertySchema = SchemaFactory.createForClass(Property);