import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;

  const transactionModel = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const agentService = {
    findOne: jest.fn(),
    addEarning: jest.fn(),
  };

  const propertyService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const makeObjectId = () => new Types.ObjectId().toString();

  const makeTransaction = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(),
    propertyId: makeObjectId(),
    listingAgentId: makeObjectId(),
    sellingAgentId: makeObjectId(),
    price: 1_000_000,
    stage: 'agreement',
    commission: null,
    save: jest.fn().mockImplementation(function save() {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TransactionService(
      transactionModel as never,
      agentService as never,
      propertyService as never,
    );

    agentService.findOne.mockResolvedValue({ id: makeObjectId() });
    agentService.addEarning.mockResolvedValue({});
    propertyService.findOne.mockResolvedValue({ id: makeObjectId() });
    propertyService.updateStatus.mockResolvedValue({});
  });

  describe('calculateCommission', () => {
    it('should give the full advisor share to one agent when listing and selling agent are the same', () => {
      const agentId = makeObjectId();

      const result = service.calculateCommission(1_000_000, agentId, agentId);

      expect(result).toEqual({
        total: 50_000,
        agency: 25_000,
        listingAgent: 25_000,
        sellingAgent: 0,
      });
    });

    it('should split the advisor share evenly when listing and selling agents are different', () => {
      const result = service.calculateCommission(
        1_000_000,
        makeObjectId(),
        makeObjectId(),
      );

      expect(result).toEqual({
        total: 50_000,
        agency: 25_000,
        listingAgent: 12_500,
        sellingAgent: 12_500,
      });
    });
  });

  describe('create', () => {
    it('should calculate and persist commission during transaction creation', async () => {
      const data = {
        propertyId: makeObjectId(),
        listingAgentId: makeObjectId(),
        sellingAgentId: makeObjectId(),
        price: 800_000,
      };

      transactionModel.create.mockResolvedValue({ id: makeObjectId(), ...data });

      await service.create(data);

      expect(propertyService.findOne).toHaveBeenCalledWith(data.propertyId);
      expect(agentService.findOne).toHaveBeenCalledWith(data.listingAgentId);
      expect(agentService.findOne).toHaveBeenCalledWith(data.sellingAgentId);
      expect(transactionModel.create).toHaveBeenCalledWith({
        ...data,
        commission: {
          total: 40_000,
          agency: 20_000,
          listingAgent: 10_000,
          sellingAgent: 10_000,
        },
      });
    });

    it('should reject invalid object ids before creating a transaction', async () => {
      await expect(
        service.create({
          propertyId: 'invalid-id',
          listingAgentId: makeObjectId(),
          sellingAgentId: makeObjectId(),
          price: 800_000,
        }),
      ).rejects.toThrow(new BadRequestException('propertyId must be a valid ObjectId'));
    });
  });

  describe('updateStage', () => {
    it('should move agreement to earnest_money and mark property as in transaction', async () => {
      const transaction = makeTransaction();
      const transactionId = transaction._id.toString();

      transactionModel.findById.mockResolvedValue(transaction);

      const result = await service.updateStage(transactionId, 'earnest_money');

      expect(result.stage).toBe('earnest_money');
      expect(propertyService.updateStatus).toHaveBeenCalledWith(
        transaction.propertyId,
        'in_transaction',
      );
      expect(agentService.addEarning).not.toHaveBeenCalled();
      expect(transaction.save).toHaveBeenCalled();
    });

    it('should normalize aliases when updating stage', async () => {
      const transaction = makeTransaction();

      transactionModel.findById.mockResolvedValue(transaction);

      const result = await service.updateStage(transaction._id.toString(), 'kapora');

      expect(result.stage).toBe('earnest_money');
    });

    it('should reject invalid stage transitions', async () => {
      const transaction = makeTransaction({ stage: 'agreement' });

      transactionModel.findById.mockResolvedValue(transaction);

      await expect(
        service.updateStage(transaction._id.toString(), 'completed'),
      ).rejects.toThrow(new BadRequestException('Invalid stage transition'));
    });

    it('should reject unknown stage values', async () => {
      const transaction = makeTransaction({ stage: 'agreement' });

      transactionModel.findById.mockResolvedValue(transaction);

      await expect(
        service.updateStage(transaction._id.toString(), 'unknown'),
      ).rejects.toThrow(new BadRequestException('Invalid stage value'));
    });

    it('should calculate commission, mark property sold, and update earnings on completion', async () => {
      const listingAgentId = makeObjectId();
      const sellingAgentId = makeObjectId();
      const propertyId = makeObjectId();
      const transaction = makeTransaction({
        propertyId,
        listingAgentId,
        sellingAgentId,
        stage: 'title_deed',
        price: 1_000_000,
        commission: null,
      });

      transactionModel.findById.mockResolvedValue(transaction);

      const result = await service.updateStage(transaction._id.toString(), 'completed');

      expect(result.stage).toBe('completed');
      expect(result.commission).toEqual({
        total: 50_000,
        agency: 25_000,
        listingAgent: 12_500,
        sellingAgent: 12_500,
      });
      expect(propertyService.updateStatus).toHaveBeenCalledWith(propertyId, 'sold');
      expect(agentService.addEarning).toHaveBeenNthCalledWith(1, listingAgentId, 12_500);
      expect(agentService.addEarning).toHaveBeenNthCalledWith(2, sellingAgentId, 12_500);
      expect(transaction.save).toHaveBeenCalled();
    });

    it('should preserve existing commission on completion instead of recalculating', async () => {
      const existingCommission = {
        total: 60_000,
        agency: 30_000,
        listingAgent: 20_000,
        sellingAgent: 10_000,
      };
      const transaction = makeTransaction({
        stage: 'title_deed',
        commission: existingCommission,
      });

      transactionModel.findById.mockResolvedValue(transaction);

      const result = await service.updateStage(transaction._id.toString(), 'completed');

      expect(result.commission).toBe(existingCommission);
      expect(agentService.addEarning).toHaveBeenNthCalledWith(
        1,
        transaction.listingAgentId,
        20_000,
      );
      expect(agentService.addEarning).toHaveBeenNthCalledWith(
        2,
        transaction.sellingAgentId,
        10_000,
      );
    });

    it('should throw when transaction does not exist', async () => {
      transactionModel.findById.mockResolvedValue(null);

      await expect(
        service.updateStage(makeObjectId(), 'earnest_money'),
      ).rejects.toThrow(new NotFoundException('Transaction not found'));
    });
  });
});