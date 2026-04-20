import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: true })
export class Agent {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ default: 0 })
  totalEarnings!: number;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

AgentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const serialized = ret as typeof ret & { id: string };
    serialized.id = String(ret._id);
    return ret;
  },
});
