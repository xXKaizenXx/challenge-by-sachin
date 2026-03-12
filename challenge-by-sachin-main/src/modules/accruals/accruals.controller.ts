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
import { AccrualsService } from './accruals.service';
import { CreateAccrualDto } from './dto/create-accrual.dto';
import { UpdateAccrualDto } from './dto/update-accrual.dto';
import { AccrualStatus } from '../../constants/accrual-status';

@ApiTags('Accruals')
@Controller('api/v1/accruals')
export class AccrualsController {
  constructor(private readonly accrualsService: AccrualsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new accrual entry' })
  @ApiResponse({
    status: 201,
    description: 'Accrual created successfully.',
  })
  async create(@Body() createDto: CreateAccrualDto) {
    return this.accrualsService.create(createDto);
  }

  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all soft deleted accruals (paginated)' })
  @ApiResponse({ status: 200, description: 'List of soft deleted accruals.' })
  async findDeleted(@Query() pageOptionsDto: any) {
    const { data, meta } = await this.accrualsService.findDeleted(pageOptionsDto);
    return { data, meta, message: 'Soft deleted accruals retrieved successfully' };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all accruals with filters' })
  @ApiResponse({ status: 200, description: 'List of accruals.' })
  @ApiQuery({
    name: 'loanId',
    required: false,
    description: 'Filter by loan ID',
  })
  @ApiQuery({
    name: 'scheduleId',
    required: false,
    description: 'Filter by schedule ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AccrualStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'accrualDateFrom',
    required: false,
    description: 'Filter by accrual date from',
  })
  @ApiQuery({
    name: 'accrualDateTo',
    required: false,
    description: 'Filter by accrual date to',
  })
  @ApiQuery({
    name: 'glPosted',
    required: false,
    description: 'Filter by GL posted status',
  })
  async findAll(
    @Query('loanId') loanId?: string,
    @Query('scheduleId') scheduleId?: string,
    @Query('status') status?: AccrualStatus,
    @Query('accrualDateFrom') accrualDateFrom?: string,
    @Query('accrualDateTo') accrualDateTo?: string,
    @Query('glPosted') glPosted?: boolean,
  ) {
    const filters = {
      loanId,
      scheduleId,
      status,
      accrualDateFrom,
      accrualDateTo,
      glPosted,
    };
    return this.accrualsService.findAll(filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an accrual by ID' })
  @ApiResponse({ status: 200, description: 'Accrual found.' })
  async findOne(@Param('id') id: string) {
    return this.accrualsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an accrual by ID' })
  @ApiResponse({ status: 200, description: 'Accrual updated.' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAccrualDto) {
    return this.accrualsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an accrual by ID' })
  @ApiResponse({ status: 204, description: 'Accrual deleted.' })
  async remove(@Param('id') id: string) {
    await this.accrualsService.remove(id);
  }

  @Delete(':id/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an accrual by ID' })
  @ApiResponse({ status: 204, description: 'Accrual soft deleted.' })
  async softDelete(@Param('id') id: string) {
    await this.accrualsService.softDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft deleted accrual by ID' })
  @ApiResponse({ status: 200, description: 'Accrual restored.' })
  async restore(@Param('id') id: string) {
    await this.accrualsService.restore(id);
  }

  @Get('loan/:loanId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all accruals for a specific loan' })
  @ApiResponse({ status: 200, description: 'List of accruals for the loan.' })
  async findByLoanId(@Param('loanId') loanId: string) {
    return this.accrualsService.findByLoanId(loanId);
  }

  @Get('schedule/:scheduleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all accruals for a specific schedule' })
  @ApiResponse({
    status: 200,
    description: 'List of accruals for the schedule.',
  })
  async findByScheduleId(@Param('scheduleId') scheduleId: string) {
    return this.accrualsService.findByScheduleId(scheduleId);
  }

  @Get('date-range/:fromDate/:toDate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get accruals within a date range' })
  @ApiResponse({ status: 200, description: 'List of accruals in date range.' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AccrualStatus,
    description: 'Filter by status',
  })
  async findByDateRange(
    @Param('fromDate') fromDate: string,
    @Param('toDate') toDate: string,
    @Query('status') status?: AccrualStatus,
  ) {
    return this.accrualsService.findByDateRange(
      new Date(fromDate),
      new Date(toDate),
      status,
    );
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an accrual as posted to GL' })
  @ApiResponse({ status: 200, description: 'Accrual marked as posted.' })
  async markAsPosted(
    @Param('id') id: string,
    @Body() body: { glReference?: string },
  ) {
    return this.accrualsService.markAsPosted(id, body.glReference);
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse an accrual' })
  @ApiResponse({ status: 200, description: 'Accrual reversed.' })
  async reverse(@Param('id') id: string) {
    return this.accrualsService.reverse(id);
  }
}
