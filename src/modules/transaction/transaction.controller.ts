import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';

@Controller(['transactions', 'transaction', 'api/transactions', 'api/transaction'])
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  // ➕ TRANSACTION OLUŞTUR
  @Post()
  create(@Body() body: CreateTransactionDto) {
    return this.service.create(body);
  }

  // 📋 TÜM TRANSACTIONS
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // 🔍 TEK TRANSACTION
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // 🔁 STAGE GÜNCELLEME (YENİ EKLENEN KISIM)
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