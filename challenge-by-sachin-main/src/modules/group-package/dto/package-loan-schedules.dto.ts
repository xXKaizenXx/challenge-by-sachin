import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

interface ClientDetails {
  id: string;
  firstName: string;
  lastName: string;
  nationalIdNumber: string;
  mobileNumber: string;
  email: string;
  gender: string;
}

interface LoanDetails {
  id: string;
  principal: number;
  totalExpectedRepayment: number;
  numberOfRepayments: number;
  loanProductName: string;
  status: string;
  expectedDisbursementDate: Date;
  disbursementDate?: Date;
  apr: number;
  client: ClientDetails;
}

export interface LoanScheduleDetails {
  id: string;
  installmentNumber: number;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  balance: number;
  status: string;
  paidDate?: Date;
  penaltyDue: number;
  penaltyPaid: number;
  applicationFeeDue?: number;
  applicationFeePaid?: number;
}

export class PackageLoanSchedulesDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  packageId: string;

  @ApiProperty({ example: 'Group Alpha' })
  groupName: string;

  @ApiProperty({ example: 'g1h2i3j4-5678-90ab-cdef-1234567890ab' })
  groupId: string;

  @ApiProperty({ example: 'Active' })
  packageStatus: string;

  @ApiProperty({ example: 1000 })
  packageAmount: number;

  @ApiProperty({ example: 1100 })
  totalExpectedRepayment: number;

  @ApiProperty({ type: () => [Object] })
  loans: {
    loan: LoanDetails;
    schedules: LoanScheduleDetails[];
  }[];

  constructor(packageData: any, loansWithSchedules: any[]) {
    this.packageId = packageData.id;
    this.groupName = packageData.groupName;
    this.groupId = packageData.groupId;
    this.packageStatus = packageData.status;
    this.packageAmount = packageData.amount;
    this.totalExpectedRepayment = packageData.totalExpectedRepayment;

    this.loans = loansWithSchedules.map(loanData => ({
      loan: {
        id: loanData.loan.id,
        principal: loanData.loan.principal,
        totalExpectedRepayment: loanData.loan.totalExpectedRepayment,
        numberOfRepayments: loanData.loan.numberOfRepayments,
        loanProductName: loanData.loan.loanProductName,
        status: loanData.loan.status,
        expectedDisbursementDate: loanData.loan.expectedDisbursementDate,
        disbursementDate: loanData.loan.disbursementDate,
        apr: loanData.loan.apr,
        client: {
          id: loanData.loan.client.id,
          firstName: loanData.loan.client.firstName,
          lastName: loanData.loan.client.lastName,
          nationalIdNumber: loanData.loan.client.nationalIdNumber,
          mobileNumber: loanData.loan.client.mobileNumber,
          email: loanData.loan.client.emailAddress,
          gender: loanData.loan.client.gender,
        }
      },
      schedules: loanData.schedules.map((schedule: any) => ({
        id: schedule.id,
        installmentNumber: schedule.installmentNumber,
        dueDate: schedule.dueDate,
        principalDue: schedule.principalDue,
        interestDue: schedule.interestDue,
        totalDue: schedule.totalDue,
        principalPaid: schedule.principalPaid,
        interestPaid: schedule.interestPaid,
        totalPaid: schedule.totalPaid,
        balance: schedule.balance,
        status: schedule.status,
        paidDate: schedule.paidDate,
        penaltyDue: schedule.penaltyDue,
        penaltyPaid: schedule.penaltyPaid,
        applicationFeeDue: schedule.applicationFeeDue,
        applicationFeePaid: schedule.applicationFeePaid,
      }))
    }));
  }
}

export class PackageLoanSchedulesResponseDto extends BaseResponseDto<PackageLoanSchedulesDto> {
  static fromPackageLoanSchedules(
    data: PackageLoanSchedulesDto | null,
    message = 'Package loan schedules retrieved successfully',
  ): PackageLoanSchedulesResponseDto {
    return BaseResponseDto.from(
      data,
      !!data,
      message,
    ) as PackageLoanSchedulesResponseDto;
  }
}