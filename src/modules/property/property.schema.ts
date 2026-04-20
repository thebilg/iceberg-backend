import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listedBy!: Types.ObjectId;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const serialized = ret as typeof ret & { id: string };
    serialized.id = String(ret._id);
    return ret;
  },
});