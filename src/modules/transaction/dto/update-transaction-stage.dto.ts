import { IsOptional, IsString } from 'class-validator';

export class UpdateTransactionStageDto {
  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  nextStage?: string;

  @IsOptional()
  @IsString()
  status?: string;
}