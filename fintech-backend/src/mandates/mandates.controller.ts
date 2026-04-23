import { Controller, Post, Get, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { CreateMandateDto, MandateResponseDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('api/mandates')
@UseGuards(JwtAuthGuard)
export class MandatesController {
  constructor(private mandatesService: MandatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMandateDto: CreateMandateDto, @CurrentUser('id') businessId: string): Promise<MandateResponseDto> {
    return this.mandatesService.create(businessId, createMandateDto);
  }

  @Get()
  async findAll(@CurrentUser('id') businessId: string): Promise<MandateResponseDto[]> {
    return this.mandatesService.findAll(businessId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') businessId: string): Promise<MandateResponseDto> {
    return this.mandatesService.findOne(id, businessId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @CurrentUser('id') businessId: string): Promise<MandateResponseDto> {
    return this.mandatesService.cancel(id, businessId);
  }
}
