import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './agent.schema';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  async create(data: any) {
    return this.agentModel.create(data);
  }

  async findAll() {
    return this.agentModel.find().exec();
  }

  async findOne(id: string) {
    return this.agentModel.findById(id).exec();
  }

  async addEarning(agentId: string, amount: number) {
    const agent = await this.agentModel.findById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    agent.totalEarnings += amount;
    await agent.save();
    return agent;
  }
}