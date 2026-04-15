import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './property.schema';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name)
    private propertyModel: Model<PropertyDocument>,
  ) {}

  async create(data: any) {
    return this.propertyModel.create(data);
  }

  async findAll() {
    return this.propertyModel.find();
  }

  async findOne(id: string) {
    return this.propertyModel.findById(id);
  }
}