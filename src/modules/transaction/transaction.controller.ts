import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';

@Controller(['transactions', 'transaction', 'api/transactions', 'api/transaction'])
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Post()
  create(@Body() body: CreateTransactionDto) {
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

  @Patch(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() body: UpdateTransactionStageDto,
  ) {
    return this.service.updateStage(
      id,
      body.stage ?? body.nextStage ?? body.status,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}