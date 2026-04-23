import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from '../common/entities/bank-account.entity';
import { CreateBankAccountDto, VerifyBankAccountDto } from './dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BankAccountsService', () => {
  let service: BankAccountsService;
  let repository: Repository<BankAccount>;

  const mockBankAccount: BankAccount = {
    id: '123',
    customerId: 'customer-1',
    accountNumber: '12345678',
    sortCode: '123456',
    accountHolderName: 'Test Account',
    isVerified: false,
    verifiedAt: null,
    verificationMethod: null,
    isActive: true,
    provider: 'gocardless',
    providerRef: 'gc_123',
    providerAccountId: 'pa_123',
    currency: 'GBP',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankAccountsService,
        {
          provide: getRepositoryToken(BankAccount),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BankAccountsService>(BankAccountsService);
    repository = module.get<Repository<BankAccount>>(getRepositoryToken(BankAccount));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      const createDto: CreateBankAccountDto = {
        accountNumber: '12345678',
        sortCode: '123456',
        accountHolderName: 'Test Account',
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockBankAccount);
      jest.spyOn(repository, 'save').mockResolvedValue(mockBankAccount);

      const result = await service.create('customer-1', createDto);

      expect(result).toEqual(mockBankAccount);
      expect(repository.create).toHaveBeenCalledWith({
        customerId: 'customer-1',
        ...createDto,
        isVerified: false,
      });
      expect(repository.save).toHaveBeenCalledWith(mockBankAccount);
    });
  });

  describe('findAll', () => {
    it('should return array of bank accounts', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockBankAccount]);

      const result = await service.findAll('customer-1');

      expect(result).toEqual([mockBankAccount]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', isActive: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a bank account', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockBankAccount);

      const result = await service.findOne('123', 'customer-1');

      expect(result).toEqual(mockBankAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('999', 'customer-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verify', () => {
    it('should verify a bank account', async () => {
      const verifyDto: VerifyBankAccountDto = {
        verificationMethod: 'micro-deposits',
      };

      const mockFindOne = jest.spyOn(service, 'findOne').mockResolvedValue(mockBankAccount);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockBankAccount, isVerified: true });

      const result = await service.verify('123', 'customer-1', verifyDto);

      expect(mockFindOne).toHaveBeenCalledWith('123', 'customer-1');
      expect(result.isVerified).toBe(true);
    });
  });

  describe('getBalance', () => {
    it('should return balance information', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBankAccount);

      const result = await service.getBalance('123', 'customer-1');

      expect(result).toHaveProperty('accountId');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('currency');
      expect(result.currency).toBe('GBP');
    });

    it('should throw BadRequestException if providerAccountId is missing', async () => {
      const invalidAccount = { ...mockBankAccount, providerAccountId: null };
      jest.spyOn(service, 'findOne').mockResolvedValue(invalidAccount);

      await expect(service.getBalance('123', 'customer-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a bank account', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBankAccount);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockBankAccount, isActive: false });

      await service.remove('123', 'customer-1');

      expect(repository.save).toHaveBeenCalled();
    });
  });
});
