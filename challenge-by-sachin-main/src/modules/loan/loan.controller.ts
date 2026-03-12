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
  Req,
  Request,
  UseFilters,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { LoanQueryDto } from './dto/loan-query.dto';
import { RoleType } from 'src/constants';
import { Auth } from 'src/decorators';
import { TypeOrmUniqueExceptionFilter } from 'src/filters/typeorm-unique-exception.filter';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanDto } from './dto/loan.dto';
import { LoansResponseDto } from './dto/loans-response.dto';
import { LoanResponseDto } from './dto/loan-response.dto';
import { LoanService } from './loan.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Loan')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) { }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get(':id/agreement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loan agreement PDF by loan ID' })
  @ApiResponse({ status: 200, description: 'Returns loan agreement PDF.' })
  async getLoanAgreementById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    return this.loanService.getLoanAgreementPdfResponse(id, res);
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan' })
  @ApiResponse({ status: 201, description: 'Loan created successfully.' })
  async create(
    @Body() createLoanDto: CreateLoanDto,
    @Request() req,
  ): Promise<
    LoansResponseDto & { agreementPdfBase64?: string; loanPackageId: string }
  > {
    const { loans, loanPackage } = await this.loanService.create(
      createLoanDto,
      req.user,
    );
    const loanDtos = loans.map((loan) => new LoanDto(loan));
    const response = new LoansResponseDto();
    response.success = true;
    response.message = 'Loans created successfully';
    response.data = loanDtos;
    response.itemCount = loanDtos.length;
    // Attach the PDF as a base64 string
    return { ...response, loanPackageId: loanPackage.id };
  }

  @Auth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all loans with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of loans.' })
  async findAll(
    @Query() query: LoanQueryDto,
    @Req() req,
  ): Promise<LoansResponseDto> {
    // Capitalize status if present
    if (query.status) {
      query.status =
        query.status.charAt(0).toUpperCase() +
        query.status.slice(1).toLowerCase();
    }
    const [itemCount, data] = await this.loanService.findAll(query, req.user);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: query });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans retrieved successfully',
      true,
    );
    return response;
  }



  @Auth([RoleType.LOAN_OFFICER])
  @Get('deleted')
  async findDeleted(@Query() pageOptionsDto: PageOptionsDto) {
    const { data, meta } = await this.loanService.findDeleted(pageOptionsDto);
    return { data, meta, message: 'Soft deleted loans retrieved successfully' };
  }

  @Auth()
  @Get('in-arrears')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all loans in arrears' })
  @ApiResponse({ status: 200, description: 'List of loans in arrears.' })
  async findInArrears(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findInArrears(
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans in arrears retrieved successfully',
      true,
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('written-off')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all written off loans' })
  @ApiResponse({ status: 200, description: 'List of written off loans.' })
  async findWrittenOff(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findWrittenOff(
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Written off loans retrieved successfully',
      true,
    );
    return response;
  }

  @Auth()
  @Get('can-be-used-for-top-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all loans that can be used for top-up' })
  @ApiResponse({
    status: 200,
    description: 'List of loans eligible for top-up.',
  })
  async findCanBeUsedForTopUp(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findCanBeUsedForTopUp(
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans eligible for top-up retrieved successfully',
      true,
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('package/:packageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by packageId' })
  @ApiResponse({
    status: 200,
    description: 'Loans by package retrieved successfully.',
  })
  async findByPackage(
    @Param('packageId') packageId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByPackageId(
      packageId,
      pageOptionsDto,
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));

    return LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by package retrieved successfully',
      true,
    );
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('client/:clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by client' })
  @ApiResponse({
    status: 200,
    description: 'Loans by client retrieved successfully.',
  })
  async findByClient(
    @Param('clientId') clientId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByClient(
      clientId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by client retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('staff/:staffId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by staff' })
  @ApiResponse({
    status: 200,
    description: 'Loans by staff retrieved successfully.',
  })
  async findByStaff(
    @Param('staffId') staffId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByStaff(
      staffId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by staff retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('group/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by group' })
  @ApiResponse({
    status: 200,
    description: 'Loans by group retrieved successfully.',
  })
  async findByGroup(
    @Param('groupId') groupId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('includeSchedule') includeSchedule = false,
    @Query('status') status = 'Active',
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByGroup(
      groupId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,

      'Loans by group retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('office/:officeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by office' })
  @ApiResponse({
    status: 200,
    description: 'Loans by office retrieved successfully.',
  })
  async findByOffice(
    @Param('officeId') officeId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByOffice(
      officeId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by office retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('status/:statusId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by status' })
  @ApiResponse({
    status: 200,
    description: 'Loans by status retrieved successfully.',
  })
  async findByStatus(
    @Param('statusId') statusId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByStatus(
      statusId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by status retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('repayment-frequency/:repaymentEvery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get loans by repayment frequency' })
  @ApiResponse({
    status: 200,
    description: 'Loans by repayment frequency retrieved successfully.',
  })
  async findByRepaymentFrequency(
    @Param('repaymentEvery') repaymentEvery: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<LoansResponseDto> {
    const [itemCount, data] = await this.loanService.findByRepaymentFrequency(
      repaymentEvery,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const loans = data.map((loan) => new LoanDto(loan));
    const response = LoansResponseDto.from(
      loans,
      pageMetaDto,
      'Loans by repayment frequency retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a loan by ID' })
  @ApiResponse({ status: 200, description: 'Loan retrieved successfully.' })
  async findOne(@Param('id') id: string): Promise<LoanResponseDto> {
    const loan = await this.loanService.findOne(id);
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan retrieved successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loan' })
  @ApiResponse({ status: 200, description: 'Loan updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
    @Request() req,
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.update(id, updateLoanDto, req.user);
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan updated successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a loan' })
  @ApiResponse({ status: 200, description: 'Loan rejected successfully.' })
  async rejectLoan(
    @Param('id') id: string,
    @Body() body: { rejectedById: string; rejectedByName: string },
    @Request() req,
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.rejectLoan(
      id,
      body.rejectedById,
      body.rejectedByName,
      req.user,
    );
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan rejected successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Post(':id/approve-first-level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve loan at first level' })
  @ApiResponse({
    status: 200,
    description: 'Loan approved at first level successfully.',
  })
  async approveFirstLevel(
    @Param('id') id: string,
    @Body() body: { approvedById: string; approvedByName: string },
    @Request() req,
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.approveFirstLevel(
      id,
      body.approvedById,
      body.approvedByName,
    );
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan approved at first level successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/approve-second-level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve loan at second level' })
  @ApiResponse({
    status: 200,
    description: 'Loan approved at second level successfully.',
  })
  async approveSecondLevel(
    @Param('id') id: string,
    @Body() body: { approvedById: string; approvedByName: string },
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.approveSecondLevel(
      id,
      body.approvedById,
      body.approvedByName,
    );
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan approved at second level successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Post(':id/disburse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse a loan' })
  @ApiResponse({ status: 200, description: 'Loan disbursed successfully.' })
  async disburse(
    @Param('id') id: string,
    @Body() body: { disbursedById: string; disbursedByName: string },
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.disburse(
      id,
      body.disbursedById,
      body.disbursedByName,
    );
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan disbursed successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Post(':id/mark-in-arrears')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark loan as in arrears' })
  @ApiResponse({
    status: 200,
    description: 'Loan marked as in arrears successfully.',
  })
  async markAsInArrears(@Param('id') id: string): Promise<LoanResponseDto> {
    const loan = await this.loanService.markAsInArrears(id);
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan marked as in arrears successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/write-off')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write off a loan' })
  @ApiResponse({ status: 200, description: 'Loan written off successfully.' })
  async writeOff(@Param('id') id: string): Promise<LoanResponseDto> {
    const loan = await this.loanService.writeOff(id);
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan written off successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Post(':id/update-next-repayment-date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update next repayment date' })
  @ApiResponse({
    status: 200,
    description: 'Next repayment date updated successfully.',
  })
  async updateNextRepaymentDate(
    @Param('id') id: string,
    @Body() body: { nextRepaymentDate: Date },
  ): Promise<LoanResponseDto> {
    const loan = await this.loanService.updateNextRepaymentDate(
      id,
      body.nextRepaymentDate,
    );
    const loanDto = new LoanDto(loan);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Next repayment date updated successfully';
    response.data = loanDto;
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a loan' })
  @ApiResponse({ status: 200, description: 'Loan deleted successfully.' })
  async remove(@Param('id') id: string): Promise<LoanResponseDto> {
    await this.loanService.remove(id);
    const response = new LoanResponseDto();
    response.success = true;
    response.message = 'Loan deleted successfully';
    response.data = null;
    return response;
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    await this.loanService.softDelete(id);
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.loanService.restore(id);
  }
}
