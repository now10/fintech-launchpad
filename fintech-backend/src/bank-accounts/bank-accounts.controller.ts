import { Controller, Post, Get, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto, VerifyBankAccountDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('api/bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Post()
  async create(@Body() createBankAccountDto: CreateBankAccountDto, @CurrentUser('id') customerId: string) {
    return this.bankAccountsService.create(customerId, createBankAccountDto);
  }

  @Get()
  async findAll(@CurrentUser('id') customerId: string) {
    return this.bankAccountsService.findAll(customerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') customerId: string) {
    return this.bankAccountsService.findOne(id, customerId);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('id') id: string, @Body() verifyDto: VerifyBankAccountDto, @CurrentUser('id') customerId: string) {
    return this.bankAccountsService.verify(id, customerId, verifyDto);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string, @CurrentUser('id') customerId: string) {
    return this.bankAccountsService.getBalance(id, customerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') customerId: string) {
    await this.bankAccountsService.remove(id, customerId);
  }
}
