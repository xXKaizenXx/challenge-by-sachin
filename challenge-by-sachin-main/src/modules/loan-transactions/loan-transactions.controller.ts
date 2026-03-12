import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoanTransactionsService } from './loan-transactions.service';
import { CreateLoanTransactionDto } from './dto/create-loan-transaction.dto';
import { UpdateLoanTransactionDto } from './dto/update-loan-transaction.dto';
import { LoanTransactionDto } from './dto/loan-transaction.dto';
import { LoanTransactionResponseDto } from './dto/loan-transaction-response.dto';
import { LoanTransactionsResponseDto } from './dto/loan-transactions-response.dto';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Loan Transactions')
@Controller('api/v1/loan-transactions')
export class LoanTransactionsController {
  constructor(private readonly service: LoanTransactionsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan transaction' })
  @ApiResponse({
    status: 201,
    description: 'Loan transaction created successfully.',
  })
  async create(
    @Body() createDto: CreateLoanTransactionDto,
  ): Promise<LoanTransactionResponseDto> {
    const loanTransaction = await this.service.create(createDto);
    const loanTransactionDto = new LoanTransactionDto(loanTransaction);
    const response = new LoanTransactionResponseDto();
    response.success = true;
    response.message = 'Loan transaction created successfully';
    response.data = loanTransactionDto;
    return response;
  }


  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all soft deleted loan transactions (paginated)' })
  @ApiResponse({ status: 200, description: 'List of soft deleted loan transactions.' })
  async findDeleted(@Query() pageOptionsDto: any) {
    const { data, meta } = await this.service.findDeleted(pageOptionsDto);
    return { data, meta, message: 'Soft deleted loan transactions retrieved successfully' };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all loan transactions with filters' })
  @ApiResponse({ status: 200, description: 'List of loan transactions.' })
  @ApiQuery({ name: 'loanId', required: false })
  @ApiQuery({ name: 'scheduleId', required: false })
  @ApiQuery({ name: 'transactionType', required: false })
  @ApiQuery({ name: 'transactionDate', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiQuery({ name: 'receiptNumber', required: false })
  @ApiQuery({ name: 'collectedBy', required: false })
  @ApiQuery({ name: 'reversalRef', required: false })
  @ApiQuery({ name: 'amountMin', required: false })
  @ApiQuery({ name: 'amountMax', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('loanId') loanId?: string,
    @Query('scheduleId') scheduleId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('transactionDate') transactionDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('receiptNumber') receiptNumber?: string,
    @Query('collectedBy') collectedBy?: string,
    @Query('reversalRef') reversalRef?: string,
    @Query('amountMin') amountMin?: string,
    @Query('amountMax') amountMax?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<LoanTransactionsResponseDto> {
    const filters = {
      loanId,
      scheduleId,
      transactionType,
      transactionDate,
      paymentMethod,
      receiptNumber,
      collectedBy,
      reversalRef,
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
    };

    const [itemCount, data] = await this.service.findAll(
      pageOptionsDto,
      filters,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loanTransactions = data.map(
      (loanTransaction) => new LoanTransactionDto(loanTransaction),
    );
    const response = LoanTransactionsResponseDto.from(
      loanTransactions,
      pageMetaDto,
      'Loan transactions retrieved successfully',
      true,
    );
    return response;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a loan transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Loan transaction retrieved successfully.',
  })
  async findOne(@Param('id') id: string): Promise<LoanTransactionResponseDto> {
    const loanTransaction = await this.service.findOne(id);
    const loanTransactionDto = new LoanTransactionDto(loanTransaction);
    const response = new LoanTransactionResponseDto();
    response.success = true;
    response.message = 'Loan transaction retrieved successfully';
    response.data = loanTransactionDto;
    return response;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loan transaction' })
  @ApiResponse({
    status: 200,
    description: 'Loan transaction updated successfully.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLoanTransactionDto,
  ): Promise<LoanTransactionResponseDto> {
    const loanTransaction = await this.service.update(id, updateDto);
    const loanTransactionDto = new LoanTransactionDto(loanTransaction);
    const response = new LoanTransactionResponseDto();
    response.success = true;
    response.message = 'Loan transaction updated successfully';
    response.data = loanTransactionDto;
    return response;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a loan transaction' })
  @ApiResponse({
    status: 200,
    description: 'Loan transaction deleted successfully.',
  })
  async remove(@Param('id') id: string): Promise<LoanTransactionResponseDto> {
    await this.service.remove(id);
    const response = new LoanTransactionResponseDto();
    response.success = true;
    response.message = 'Loan transaction deleted successfully';
    response.data = null;
    return response;
  }

  @Delete(':id/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a loan transaction by ID' })
  @ApiResponse({ status: 204, description: 'Loan transaction soft deleted.' })
  async softDelete(@Param('id') id: string) {
    await this.service.softDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft deleted loan transaction by ID' })
  @ApiResponse({ status: 200, description: 'Loan transaction restored successfully.' })
  async restore(@Param('id') id: string) {
    await this.service.restore(id);
  }
}