import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  accountId: number;

  @IsNumber()
  amount: number;

  @IsString()
  transactionType: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  transactionType?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TransactionResponseDto {
  id: number;
  userId: number;
  accountId: number;
  amount: number;
  transactionType: string;
  createdAt: Date;
  updatedAt: Date;
}
