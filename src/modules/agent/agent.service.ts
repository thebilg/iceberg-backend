import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './agent.schema';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel(Agent.name)
    private agentModel: Model<AgentDocument>,
  ) {}

  async create(data: any) {
    return this.agentModel.create(data);
  }

  async findAll() {
    return this.agentModel.find();
  }

  async findOne(id: string) {
    return this.agentModel.findById(id);
  }

  async addEarning(id: string, amount: number) {
    return this.agentModel.findByIdAndUpdate(
      id,
      { $inc: { totalEarnings: amount } },
      { new: true },
    );
  }
}