import { Test, TestingModule } from '@nestjs/testing';
import { MandatesService } from './mandates.service';
import { CreateMandateDto, MandateResponseDto } from './dto';
import { NotFoundException } from '@nestjs/common';

describe('MandatesService', () => {
  let service: MandatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MandatesService],
    }).compile();

    service = module.get<MandatesService>(MandatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a mandate', async () => {
      const createDto: CreateMandateDto = {
        customerId: 'customer-1',
        reference: 'mandate-ref-001',
        scheme: 'sepa_core',
      };

      const result = await service.create('business-1', createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('businessId', 'business-1');
      expect(result).toHaveProperty('customerId', 'customer-1');
      expect(result).toHaveProperty('reference', 'mandate-ref-001');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('providerRef');
    });
  });

  describe('findAll', () => {
    it('should return empty array', async () => {
      const result = await service.findAll('business-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException', async () => {
      await expect(service.findOne('123', 'business-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException', async () => {
      await expect(service.cancel('123', 'business-1')).rejects.toThrow(NotFoundException);
    });
  });
});
