import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { AgentService } from '../agent/agent.service';
import { PropertyService } from '../property/property.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

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

  private getRefId(
    value: Types.ObjectId | { _id?: Types.ObjectId | string } | string | null | undefined,
    field: string,
  ) {
    if (!value) {
      throw new BadRequestException(`${field} is required`);
    }

    if (typeof value === 'string') {
      this.assertValidObjectId(value, field);
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (value._id) {
      const id = String(value._id);
      this.assertValidObjectId(id, field);
      return id;
    }

    throw new BadRequestException(`${field} must be a valid ObjectId`);
  }

  private async assertCompletionDependencies(transaction: TransactionDocument) {
    const propertyId = this.getRefId(transaction.propertyId, 'propertyId');
    const listingAgentId = this.getRefId(
      transaction.listingAgentId,
      'listingAgentId',
    );
    const sellingAgentId = this.getRefId(
      transaction.sellingAgentId,
      'sellingAgentId',
    );

    await Promise.all([
      this.assertPropertyExists(propertyId),
      this.assertAgentExists(listingAgentId, 'listingAgentId'),
      this.assertAgentExists(sellingAgentId, 'sellingAgentId'),
    ]);

    return {
      propertyId,
      listingAgentId,
      sellingAgentId,
    };
  }

  private normalizeStage(stage: unknown) {
    if (typeof stage !== 'string' || !stage.trim()) {
      throw new BadRequestException('Stage is required');
    }

    const normalized = stage
      .trim()
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    const aliases: Record<string, string> = {
      agreement: 'agreement',
      anlasma: 'agreement',
      anlasma_imzalandi: 'agreement',
      earnest_money: 'earnest_money',
      kapora: 'earnest_money',
      kapora_alindi: 'earnest_money',
      title_deed: 'title_deed',
      tapu: 'title_deed',
      tapuda: 'title_deed',
      completed: 'completed',
      tamamlandi: 'completed',
      tamamlandi_olarak_isaretle: 'completed',
      complete: 'completed',
    };

    return aliases[normalized] ?? normalized;
  }

  async create(data: CreateTransactionDto) {
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

  async findAll() {
    return this.transactionModel
      .find()
      .populate('propertyId')
      .populate('listingAgentId')
      .populate('sellingAgentId');
  }

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

  async updateStage(id: string, nextStage: unknown) {
    this.assertValidObjectId(id, 'transaction id');

    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const order = [
      'agreement',
      'earnest_money',
      'title_deed',
      'completed',
    ];

    const normalizedNextStage = this.normalizeStage(nextStage);

    const currentIndex = order.indexOf(transaction.stage);
    const nextIndex = order.indexOf(normalizedNextStage);

    if (nextIndex === -1) {
      throw new BadRequestException('Invalid stage value');
    }

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestException('Invalid stage transition');
    }

    const refs = await this.assertCompletionDependencies(transaction);

    transaction.stage = normalizedNextStage;

    if (normalizedNextStage === 'earnest_money' || normalizedNextStage === 'title_deed') {
      await this.propertyService.updateStatus(
        refs.propertyId,
        'in_transaction',
      );
    }

    if (normalizedNextStage === 'completed') {
      const commission =
        transaction.commission ??
        this.calculateCommission(
          transaction.price,
          refs.listingAgentId,
          refs.sellingAgentId,
        );

      transaction.commission = commission;

      await this.propertyService.updateStatus(
        refs.propertyId,
        'sold',
      );

      if (commission) {
        await this.agentService.addEarning(
          refs.listingAgentId,
          commission.listingAgent,
        );

        await this.agentService.addEarning(
          refs.sellingAgentId,
          commission.sellingAgent,
        );
      }
    }

    return transaction.save();
  }

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