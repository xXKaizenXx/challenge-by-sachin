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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LoanScheduleService } from './loan-schedule.service';
import { CreateLoanScheduleDto } from './dto/create-loan-schedule.dto';
import { UpdateLoanScheduleDto } from './dto/update-loan-schedule.dto';
import { LoanScheduleStatus } from '../../constants/loan-schedule-status';

@ApiTags('Loan Schedule')
@Controller('api/v1/loan-schedule')
export class LoanScheduleController {
  constructor(private readonly loanScheduleService: LoanScheduleService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan schedule entry' })
  @ApiResponse({
    status: 201,
    description: 'Loan schedule created successfully.',
  })
  async create(@Body() createDto: CreateLoanScheduleDto) {
    return this.loanScheduleService.create(createDto);
  }

  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  async findDeleted(@Query() pageOptionsDto: any) {
    const { data, meta } = await this.loanScheduleService.findDeleted(pageOptionsDto);
    return { data, meta, message: 'Soft deleted loan schedules retrieved successfully' };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all loan schedules with filters' })
  @ApiResponse({ status: 200, description: 'List of loan schedules.' })
  @ApiQuery({
    name: 'loanId',
    required: false,
    description: 'Filter by loan ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LoanScheduleStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'dueDateFrom',
    required: false,
    description: 'Filter by due date from',
  })
  @ApiQuery({
    name: 'dueDateTo',
    required: false,
    description: 'Filter by due date to',
  })
  @ApiQuery({
    name: 'installmentNumber',
    required: false,
    description: 'Filter by installment number',
  })
  async findAll(
    @Query('loanId') loanId?: string,
    @Query('status') status?: LoanScheduleStatus,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('installmentNumber') installmentNumber?: number,
  ) {
    const filters = {
      loanId,
      status,
      dueDateFrom,
      dueDateTo,
      installmentNumber,
    };
    return this.loanScheduleService.findAll(filters);
  }

  @Get('loan/:loanId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all schedule entries for a loan' })
  @ApiResponse({
    status: 200,
    description: 'List of loan schedules for a loan.',
  })
  async findByLoan(@Param('loanId') loanId: string) {
    return this.loanScheduleService.findAll({ loanId });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a loan schedule by ID' })
  @ApiResponse({ status: 200, description: 'Loan schedule found.' })
  async findOne(@Param('id') id: string) {
    return this.loanScheduleService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loan schedule by ID' })
  @ApiResponse({ status: 200, description: 'Loan schedule updated.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLoanScheduleDto,
  ) {
    return this.loanScheduleService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loan schedule by ID' })
  @ApiResponse({ status: 204, description: 'Loan schedule deleted.' })
  async remove(@Param('id') id: string) {
    await this.loanScheduleService.remove(id);
  }

  @Delete(':id/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string) {
    await this.loanScheduleService.softDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    await this.loanScheduleService.restore(id);
  }
}
