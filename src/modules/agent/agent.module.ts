import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Agent, AgentSchema } from './agent.schema';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agent.name, schema: AgentSchema },
    ]),
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}