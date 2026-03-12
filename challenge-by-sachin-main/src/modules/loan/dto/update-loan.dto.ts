import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsBoolean,
  IsInt,
  IsDateString,
  IsIn,
} from 'class-validator';

export class UpdateLoanDto {
  @ApiPropertyOptional({ description: 'Client ID for the loan' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Principal amount of the loan' })
  @IsInt()
  @IsOptional()
  principal?: number;

  @ApiPropertyOptional({ description: 'Total interest amount' })
  @IsInt()
  @IsOptional()
  totalInterest?: number;

  @ApiPropertyOptional({ description: 'Interest breakdown as JSON object' })
  @IsObject()
  @IsOptional()
  interestBreakDown?: object;

  @ApiPropertyOptional({ description: 'Total expected repayment amount' })
  @IsInt()
  @IsOptional()
  totalExpectedRepayment?: number;

  @ApiPropertyOptional({ description: 'Expected disbursement date' })
  @IsDateString()
  @IsOptional()
  expectedDisbursementDate?: Date;

  @ApiPropertyOptional({ description: 'Number of repayments' })
  @IsInt()
  @IsOptional()
  numberOfRepayments?: number;

  @ApiPropertyOptional({ description: 'Loan product ID' })
  @IsUUID()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Loan product name' })
  @IsString()
  @IsOptional()
  loanProductName?: string;

  @ApiPropertyOptional({ description: 'Repayment frequency' })
  @IsString()
  @IsOptional()
  @IsIn(['week', 'monthly', 'bi-weekly', 'daily', 'quarterly', 'annually'])
  repaymentEvery?: string;

  @ApiPropertyOptional({ description: 'Expected first repayment date' })
  @IsDateString()
  @IsOptional()
  expectedFirstRepaymentOnDate?: Date;

  @ApiPropertyOptional({ description: 'Loan timeline as JSON object' })
  @IsObject()
  @IsOptional()
  timeline?: object;

  @ApiPropertyOptional({ description: 'Repayments due dates as JSON object' })
  @IsObject()
  @IsOptional()
  repaymentsDueDates?: object;

  @ApiPropertyOptional({ description: 'Annual Percentage Rate' })
  @IsInt()
  @IsOptional()
  apr?: number;

  @ApiPropertyOptional({ description: 'Group ID for the loan' })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Group name' })
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiPropertyOptional({ description: 'Application fee amount' })
  @IsInt()
  @IsOptional()
  applicationFee?: number;

  @ApiPropertyOptional({ description: 'Total service fee amount' })
  @IsInt()
  @IsOptional()
  totalServiceFee?: number;

  @ApiPropertyOptional({ description: 'Installments as JSON object' })
  @IsObject()
  @IsOptional()
  installments?: object;

  @ApiPropertyOptional({ description: 'Agreement form file link' })
  @IsString()
  @IsOptional()
  agreementForm?: string;

  @ApiPropertyOptional({ description: 'Disbursement date' })
  @IsDateString()
  @IsOptional()
  disbursementDate?: Date;

  @ApiPropertyOptional({ description: 'Disbursed by ID' })
  @IsUUID()
  @IsOptional()
  disbursedById?: string;

  @ApiPropertyOptional({ description: 'Disbursed by name' })
  @IsString()
  @IsOptional()
  disbursedByName?: string;

  @ApiPropertyOptional({ description: 'First approved on date' })
  @IsDateString()
  @IsOptional()
  firstApprovedOn?: Date;

  @ApiPropertyOptional({ description: 'First approved by ID' })
  @IsUUID()
  @IsOptional()
  firstApprovedById?: string;

  @ApiPropertyOptional({ description: 'First approved by name' })
  @IsString()
  @IsOptional()
  firstApprovedByName?: string;

  @ApiPropertyOptional({ description: 'Second approval by ID' })
  @IsUUID()
  @IsOptional()
  secondApprovalById?: string;

  @ApiPropertyOptional({ description: 'Second approval by name' })
  @IsString()
  @IsOptional()
  secondApprovalByName?: string;

  @ApiPropertyOptional({ description: 'Second approval on date' })
  @IsDateString()
  @IsOptional()
  secondApprovalOnDate?: Date;

  @ApiPropertyOptional({ description: 'Whether loan can be used for top-up' })
  @IsBoolean()
  @IsOptional()
  canBeUsedForTopUp?: boolean;

  @ApiPropertyOptional({ description: 'Office ID' })
  @IsUUID()
  @IsOptional()
  officeId?: string;

  @ApiPropertyOptional({ description: 'Office name' })
  @IsString()
  @IsOptional()
  officeName?: string;

  @ApiPropertyOptional({ description: 'Whether loan is in arrears' })
  @IsBoolean()
  @IsOptional()
  inArrears?: boolean;

  @ApiPropertyOptional({ description: 'Whether loan is written off' })
  @IsBoolean()
  @IsOptional()
  isWrittenOff?: boolean;

  @ApiPropertyOptional({ description: 'Status ID' })
  @IsUUID()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Status name' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Arrears start date' })
  @IsDateString()
  @IsOptional()
  arrearsStartDate?: Date;

  @ApiPropertyOptional({ description: 'Next repayment date' })
  @IsDateString()
  @IsOptional()
  nextRepaymentDate?: Date;
}
