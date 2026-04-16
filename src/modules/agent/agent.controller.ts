import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.service.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}