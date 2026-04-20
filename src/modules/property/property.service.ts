import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './property.schema';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private agentService: AgentService,
  ) {}

  async create(data: any) {
    if (!Types.ObjectId.isValid(data.listedBy)) {
      throw new BadRequestException('listedBy must be a valid ObjectId');
    }

    const agent = await this.agentService.findOne(data.listedBy);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.propertyModel.create(data);
  }

  async findAll() {
    return this.propertyModel.find().populate('listedBy', 'name').exec();
  }

  async findOne(id: string) {
    return this.propertyModel.findById(id).populate('listedBy', 'name').exec();
  }

  async updateStatus(id: string, status: 'available' | 'in_transaction' | 'sold') {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid property id');
    }

    const property = await this.propertyModel.findById(id).exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    property.status = status;
    await property.save();

    return property;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid property id');
    }

    const deletedProperty = await this.propertyModel.findByIdAndDelete(id).exec();

    if (!deletedProperty) {
      throw new NotFoundException('Property not found');
    }

    return deletedProperty;
  }
}