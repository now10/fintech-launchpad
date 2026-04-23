import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  accountNumber: string;

  @IsNumber()
  balance: number;

  @IsString()
  accountType: string;

  @IsString()
  userId: string;
}

export class UpdateAccountDto {
  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  accountType?: string;
}

export class AccountResponseDto {
  id: number;
  accountNumber: string;
  balance: number;
  accountType: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
