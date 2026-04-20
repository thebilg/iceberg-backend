import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller(['transactions', 'transaction', 'api/transactions', 'api/transaction'])
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  // ➕ TRANSACTION OLUŞTUR
  @Post()
  create(@Body() body: any) {
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
    @Body('stage') stage: string,
  ) {
    return this.service.updateStage(id, stage);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}