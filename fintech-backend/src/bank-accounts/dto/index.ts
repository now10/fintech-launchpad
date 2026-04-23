import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  accountNumber: string;

  @IsString()
  sortCode: string;

  @IsString()
  accountHolderName: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  providerRef?: string;
}

export class VerifyBankAccountDto {
  @IsString()
  verificationMethod: 'micro-deposits' | 'instant' | 'plaid';

  @IsString()
  @IsOptional()
  verificationCode?: string;
}

export class BankAccountResponseDto {
  id: string;
  customerId: string;
  accountNumber: string;
  sortCode: string;
  accountHolderName: string;
  isVerified: boolean;
  isActive: boolean;
  provider: string;
  providerRef: string;
  createdAt: Date;
  updatedAt: Date;
}
