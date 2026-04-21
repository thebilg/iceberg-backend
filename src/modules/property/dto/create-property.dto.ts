import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsMongoId, Min } from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsMongoId()
  listedBy!: string;
}