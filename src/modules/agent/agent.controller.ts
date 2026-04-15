import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agents')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
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