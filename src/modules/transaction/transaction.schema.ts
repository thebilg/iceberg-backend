import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listingAgentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  sellingAgentId!: Types.ObjectId;

  @Prop({ required: true })
  price!: number;

  @Prop({
    default: 'agreement',
    enum: ['agreement', 'earnest_money', 'title_deed', 'completed'],
  })
  stage!: string;

  // 💥 FIX BURASI
  @Prop({
    type: {
      total: Number,
      agency: Number,
      listingAgent: Number,
      sellingAgent: Number,
    },
    default: null,
  })
  commission!: {
    total: number;
    agency: number;
    listingAgent: number;
    sellingAgent: number;
  };
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const serialized = ret as typeof ret & { id: string };
    serialized.id = String(ret._id);
    return ret;
  },
});