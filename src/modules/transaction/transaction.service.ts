import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { AgentService } from '../agent/agent.service';
import { PropertyService } from '../property/property.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private agentService: AgentService,
    private propertyService: PropertyService,
  ) {}

  private assertValidObjectId(value: unknown, field: string) {
    if (!value || !Types.ObjectId.isValid(String(value))) {
      throw new BadRequestException(`${field} must be a valid ObjectId`);
    }
  }

  private async assertPropertyExists(id: string) {
    const property = await this.propertyService.findOne(id);
    if (!property) {
      throw new NotFoundException(`Property not found: ${id}`);
    }
  }

  private async assertAgentExists(id: string, field: string) {
    const agent = await this.agentService.findOne(id);
    if (!agent) {
      throw new NotFoundException(`${field} not found: ${id}`);
    }
  }

  // ➕ TRANSACTION OLUŞTUR
  async create(data: any) {
    this.assertValidObjectId(data.propertyId, 'propertyId');
    this.assertValidObjectId(data.listingAgentId, 'listingAgentId');
    this.assertValidObjectId(data.sellingAgentId, 'sellingAgentId');

    await this.assertPropertyExists(data.propertyId);
    await this.assertAgentExists(data.listingAgentId, 'listingAgentId');
    await this.assertAgentExists(data.sellingAgentId, 'sellingAgentId');

    const commission = this.calculateCommission(
      data.price,
      data.listingAgentId,
      data.sellingAgentId,
    );

    return this.transactionModel.create({
      ...data,
      commission,
    });
  }

  // 📋 TÜM TRANSACTIONS
  async findAll() {
    return this.transactionModel
      .find()
      .populate('propertyId')
      .populate('listingAgentId')
      .populate('sellingAgentId');
  }

  // 🔍 TEK TRANSACTION
  async findOne(id: string) {
    return this.transactionModel
      .findById(id)
      .populate('propertyId')
      .populate('listingAgentId')
      .populate('sellingAgentId');
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction id');
    }

    const deletedTransaction = await this.transactionModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return deletedTransaction;
  }

  // 🔁 STAGE GÜNCELLEME
  async updateStage(id: string, nextStage: string) {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const order = [
      'agreement',
      'earnest_money',
      'title_deed',
      'completed',
    ];

    const currentIndex = order.indexOf(transaction.stage);
    const nextIndex = order.indexOf(nextStage);

    if (nextIndex !== currentIndex + 1) {
      throw new Error('Invalid stage transition');
    }

    transaction.stage = nextStage;

      if (nextStage === 'completed') {
    const commission = transaction.commission;

    if (commission) {
      await this.agentService.addEarning(
        transaction.listingAgentId.toString(),
        commission.listingAgent,
      );

      await this.agentService.addEarning(
        transaction.sellingAgentId.toString(),
        commission.sellingAgent,
      );
    }
  }


    return transaction.save();
  }

  // 💰 COMMISSION HESAPLAMA
  calculateCommission(
    price: number,
    listingId: string,
    sellingId: string,
  ) {
    const total = price * 0.05; // %5 komisyon

    const agency = total * 0.5;

    let listingAgent = 0;
    let sellingAgent = 0;

    if (listingId === sellingId) {
      listingAgent = total * 0.5;
    } else {
      listingAgent = total * 0.25;
      sellingAgent = total * 0.25;
    }

    return {
      total,
      agency,
      listingAgent,
      sellingAgent,
    };
  }
}