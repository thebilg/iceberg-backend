import { IsNotEmpty, IsString, IsNumber, IsMongoId } from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsMongoId()
  listedBy!: string;
}