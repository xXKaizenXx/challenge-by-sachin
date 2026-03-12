import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { PageOptionsDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';
import { Auth } from 'src/decorators';
import { TypeOrmUniqueExceptionFilter } from 'src/filters/typeorm-unique-exception.filter';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { BankService } from './bank.service';

@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/banks')
export class BankController {
  constructor(private readonly bankService: BankService) { }

  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBankDto: CreateBankDto) {
    const bank = await this.bankService.create(createBankDto);
    return bank;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return await this.bankService.findAll(pageOptionsDto);
  }


  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Get('deleted')
  async findDeleted(@Query() pageOptionsDto: PageOptionsDto) {
    const { data, meta } = await this.bankService.findDeleted(pageOptionsDto);
    return { data, meta, message: 'Soft deleted banks retrieved successfully' };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const bank = await this.bankService.findOne(id);
    return bank;
  }

  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    const bank = await this.bankService.update(id, updateBankDto);
    return bank;
  }

  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.bankService.remove(id);
  }

  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.bankService.softDelete(id);
  }

  @Auth([RoleType.CREDIT, RoleType.SUPER_USER])
  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<void> {
    await this.bankService.restore(id);
  }
}
