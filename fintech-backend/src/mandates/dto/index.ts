import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMandateDto {
  @IsString()
  customerId: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  scheme?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class MandateResponseDto {
  id: string;
  businessId: string;
  customerId: string;
  reference: string;
  scheme: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  providerRef: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
