import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  propertyId!: string;

  @IsMongoId()
  listingAgentId!: string;

  @IsMongoId()
  sellingAgentId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  stage?: string;
}