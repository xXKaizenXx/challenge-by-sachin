// ...existing code...
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  Response,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupPackageService } from './group-package.service';
import {
  CreateGroupPackageDto,
  UpdateGroupPackageDto,
  GroupPackageResponseDto,
  GroupPackageDetailsDto,
  GroupPackageDetailsResponseDto,
  BulkDisburseGroupPackagesDto,
  GroupPackageBalanceResponseDto,
} from './dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { RoleType } from '../../constants/role-type';
import { Auth } from '../../decorators/http.decorators';
import {
  BaseResponseDto,
  PageResponseDto,
  PageOptionsDto,
} from 'src/common/dtos';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupPackageFilterDto } from './dto/group-package-filter.dto';
import { format } from '@fast-csv/format';
import { PackageTransactionsResponseDto } from './dto/package-transaction.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Group Packages')
@Controller('api/v1/group-packages')
@UseGuards(AuthGuard(), RolesGuard)
export class GroupPackageController {
  constructor(private readonly groupPackageService: GroupPackageService) {}


  @Post('migrate-agreement-forms')
  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER ,RoleType.IT])
  @ApiOperation({ summary: 'Migrate base64 agreementForm files to DigitalOcean Spaces for all GroupPackages and Loans' })
  @ApiResponse({ status: 200, description: 'Migration completed. Returns summary of migrated and failed items.' })
  async migrateAgreementForms(@Request() req) {
    return await this.groupPackageService.migrateAgreementFormsToSpaces();
  }

  @Post('bulk-disburse')
  @Auth([RoleType.SUPER_USER])
  async bulkDisburse(
    @Body() dto: BulkDisburseGroupPackagesDto,
    @Request() req,
  ) {
    try {
      const result = await this.groupPackageService.bulkDisburse(dto, req.user);
      return {
        success: true,
        message: 'Bulk disbursement completed',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Bulk disbursement failed',
        error,
      };
    }
  }

  @Post()
  @Auth([RoleType.LOAN_OFFICER])
  async create(@Body() dto: CreateGroupPackageDto, @Request() req) {
    const result = await this.groupPackageService.create(dto);
    const groupDto = GroupPackageResponseDto.fromGroupPackage(result);
    const response = BaseResponseDto.from(
      groupDto,
      true,
      'Group package created successfully',
    );
    return response;
  }

  @Get()
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  // Only keep manual @ApiQuery for status, let DTO handle order/page/take
  async findAll(@Request() req, @Query() filterDto: GroupPackageFilterDto) {
    const result = await this.groupPackageService.findAllPaginated(
      req.user,
      filterDto,
    );
    const response = PageResponseDto.from(
      result.data,
      result.meta,
      'Group packages fetched successfully',
      true,
    );
    return response;
  }

  @Get('summary')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async getSummary(@Request() req) {
    const result = await this.groupPackageService.getSummary(req.user);

    const response = BaseResponseDto.from(
      result,
      true,
      'Group package summary fetched successfully',
    );

    return response;
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Get('deleted')
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.groupPackageService.findDeleted(query);
    // You may want to map to DTOs here if needed
    return PageResponseDto.from(
      data,
      meta,
      'Soft-deleted group packages retrieved successfully',
      true,
    );
  }

  @Get('package/:packageId')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async getPackageDetails(@Param('packageId') id: string, @Request() req) {
    const result = await this.groupPackageService.getPackageDetails(
      id,
      req.user,
    );
    const packageDetailsDto = new GroupPackageDetailsDto(result);
    return GroupPackageDetailsResponseDto.fromGroupPackage(packageDetailsDto);
  }

  @Get(':id/balance')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  @ApiOperation({ 
    summary: 'Get group package balance',
    description: 'Retrieve the current outstanding balance breakdown for a specific group package'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Group package balance retrieved successfully',
    type: GroupPackageBalanceResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Group package not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied - insufficient permissions' 
  })
  async getPackageBalance(
    @Param('id') id: string, 
    @Request() req
  ) {
    const result = await this.groupPackageService.getPackageBalance(id, req.user);
    const balanceDto = new GroupPackageBalanceResponseDto(result);
    
    const response = BaseResponseDto.from(
      balanceDto,
      true,
      'Group package balance retrieved successfully',
    );
    
    return response;
  }
  // @Get(':packageId/loans/:loanId/agreement')
  // @Auth([
  //   RoleType.LOAN_OFFICER,
  //   RoleType.BRANCH_MANAGER,
  //   RoleType.SUPER_USER,
  //   RoleType.REGIONAL_MANAGER,
  // ])
  // async getLoanAgreement(
  //   @Param('packageId') packageId: string,
  //   @Param('loanId') loanId: string,
  //   @Request() req
  // ) {
  //   const result = await this.groupPackageService.getLoanAgreement(packageId, loanId, req.user);
  //   const loanAgreementDto = new LoanAgreementDto(result);
  //   return LoanAgreementResponseDto.fromLoanAgreement(loanAgreementDto);
  // }

  //get group pakcage by group id
  @Get('group/:id')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async findByGroup(@Param('id') id: string, @Request() req) {
    const result = await this.groupPackageService.findByGroup(id, req.user);
    const response = BaseResponseDto.from(
      result,
      true,
      'Group package fetched successfully',
    );
    return response;
  }

  //get group packages with first unpaid loan schedules by group id
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.REGIONAL_MANAGER,
    RoleType.SUPER_USER,
  ])
  @Get(':packageId/schedules')
  async getPackageLoanSchedules(
    @Param('packageId') id: string,
    @Query() pageOptions: PageOptionsDto,
  ) {
    const result = await this.groupPackageService.getPackageLoanSchedules(
      id,
      pageOptions,
    );
    return PageResponseDto.from(
      result.data,
      result.meta,
      'Package loan schedules fetched successfully',
      true,
    );
  }

  @Patch(':id')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupPackageDto,
    @Request() req,
  ) {
    const result = await this.groupPackageService.update(id, dto, req.user);
    return GroupPackageResponseDto.fromGroupPackage(result);
  }

  @Patch(':packageId/upload-agreement')
  @UseInterceptors(FileInterceptor('agreementForm'))
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @ApiOperation({ summary: 'Upload group package agreement form to S3' })
  @ApiResponse({
    status: 200,
    description: 'Agreement form uploaded successfully.',
  })
  async uploadAgreementForm(
    @Param('packageId') packageId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Promise<GroupPackageResponseDto> {
    if (!file) {
      throw new BadRequestException('Agreement form file is required');
    }

    const groupPackage = await this.groupPackageService.uploadAgreementForm(
      packageId,
      file,
      req.user,
    );
    return GroupPackageResponseDto.fromGroupPackage(groupPackage);
  }

  @Delete(':id')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async remove(@Param('id') id: string, @Request() req) {
    await this.groupPackageService.remove(id, req.user);
    return GroupPackageResponseDto.fromGroupPackage(
      null,
      'Group package deleted successfully',
    );
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    await this.groupPackageService.softDelete(id);
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.groupPackageService.restore(id);
  }

  @Post(':id/approve')
  @Auth([RoleType.BRANCH_MANAGER])
  async approve(@Param('id') id: string, @Request() req) {
    const result = await this.groupPackageService.approve(id, req.user);
    return GroupPackageResponseDto.fromGroupPackage(result);
  }

  @Post(':id/reject')
  @Auth([RoleType.BRANCH_MANAGER])
  async reject(@Param('id') id: string, @Request() req) {
    const result = await this.groupPackageService.reject(id, req.user);
    return GroupPackageResponseDto.fromGroupPackage(result);
  }
  

  @Get(':packageId/transactions')
@Auth([
  RoleType.LOAN_OFFICER,
  RoleType.BRANCH_MANAGER,
  RoleType.SUPER_USER,
  RoleType.REGIONAL_MANAGER,
])
@ApiOperation({ summary: 'Get all transactions for a group package' })
@ApiResponse({ 
  status: 200, 
  description: 'Package transactions retrieved successfully',
  type: PackageTransactionsResponseDto 
})
async getPackageTransactions(
  @Param('packageId') packageId: string,
  @Query() pageOptions: PageOptionsDto
) {
  const result = await this.groupPackageService.getPackageTransactions(packageId, pageOptions);
  return PageResponseDto.from(
    result.data,
    result.meta,
    'Package transactions retrieved successfully',
    true,
  );
}

 @Get('loans/:loanId/transactions')
@Auth([
  RoleType.LOAN_OFFICER,
  RoleType.BRANCH_MANAGER,
  RoleType.SUPER_USER,
  RoleType.REGIONAL_MANAGER,
])
@ApiOperation({ summary: 'Get all transactions for a group package' })
@ApiResponse({ 
  status: 200, 
  description: 'Package transactions retrieved successfully',
  type: PackageTransactionsResponseDto 
})
async getPackageTransactionsByLoanId(
  @Param('loanId') loanId: string,
  @Query() pageOptions: PageOptionsDto
) {
  const result = await this.groupPackageService.getPackageTransactionsByLoanId(loanId, pageOptions);
  return PageResponseDto.from(
    result.data,
    result.meta,
    'Package transactions retrieved successfully',
    true,
  );
}
  @Get('by-group/:groupId')
  @Auth([
    RoleType.LOAN_OFFICER,
    RoleType.BRANCH_MANAGER,
    RoleType.SUPER_USER,
    RoleType.REGIONAL_MANAGER,
  ])
  async findByGroupId(@Param('groupId') groupId: string) {
    const result = await this.groupPackageService.findByGroupId(groupId);
    // Return group name and loans with loan details
    const response = result.map((pkg) => ({
      groupName: pkg.groupName,
      loans: pkg.loans,
    }));
    return response;
  }

  @Post('get-disbursements-csv')
  @Auth([RoleType.SUPER_USER])
  async getDisbusrementsCsv(@Request() req, @Response() res) {
    const result = await this.groupPackageService.disburse(req.user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="disbursements.csv"',
    );

    const csvStream = format({
      headers: [
        'Disbursement Date',
        'Name',
        'Bank Account',
        'Bank Name',
        'Branch Code',
        'Amount',
      ],
    });

    csvStream.pipe(res);

    for (const r of result) {
      csvStream.write({
        'Disbursement Date': r.disbursement_date,
        Name: r.names,
        'Bank Account': r.bank_account_number,
        'Bank Name': r.bank,
        'Branch Code': r.branch_code,
        Amount: r.principal,
      });
    }
    csvStream.end();
  }

   @Get('superuser-metrics')
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Get Super User Dashboard Metrics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard metrics for super user.' })
  async getDashboardMetrics() {
    const metrics = await this.groupPackageService.getSuperUserDashboardMetrics();
    return metrics;
  }

  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER, RoleType.SUPER_USER])
  @Get(':packageId/loan-agreement')
  async getLoanAgreementNoGuard(@Param('packageId') packageId: string) {
    const result = await this.groupPackageService.getLoanAgreement(packageId);
    return {
      success: true,
      message: 'Loan agreement fetched successfully',
      data: result,
    };
  }
}
