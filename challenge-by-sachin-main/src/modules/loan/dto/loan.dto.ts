import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import { LoanEntity } from '../entities/loan.entity';
import { LoanScheduleEntity } from 'src/modules/loan-schedule/entities/loan-schedule.entity';

export class LoanDto extends AbstractDto {
  @ApiProperty()
  clientId: string;

  @ApiProperty()
  principal: number;

  @ApiProperty()
  totalInterest: number;

  @ApiProperty()
  interestBreakDown: object;

  @ApiProperty()
  totalExpectedRepayment: number;

  @ApiProperty()
  expectedDisbursementDate: Date;

  @ApiProperty()
  numberOfRepayments: number;

  @ApiProperty()
  loanProductName: string;

  @ApiProperty()
  staffId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  expectedFirstRepaymentOnDate: Date;

  @ApiProperty()
  repaymentsDueDates: object;

  @ApiProperty()
  apr: number;

  @ApiPropertyOptional()
  groupId?: string;

  @ApiPropertyOptional()
  groupName?: string;

  @ApiProperty()
  applicationFee: number;

  @ApiProperty()
  totalServiceFee: number;

  @ApiProperty()
  installments: object;

  @ApiProperty()
  agreementForm: string;

  @ApiPropertyOptional()
  disbursementDate?: Date;

  @ApiPropertyOptional()
  disbursedById?: string;

  @ApiPropertyOptional()
  disbursedByName?: string;

  @ApiProperty()
  officeId: string;

  @ApiProperty()
  officeName: string;

  @ApiProperty()
  inArrears: boolean;

  @ApiProperty()
  isWrittenOff: boolean;

  @ApiProperty()
  statusId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  groupPackage?: string;

  @ApiProperty()
  schedule: any[];

  constructor(loan: LoanEntity) {
    super(loan);

    this.clientId = loan.clientId;
    this.principal = loan.principal;
    this.totalInterest = loan.totalInterest;
    this.interestBreakDown = loan.interestBreakDown;
    this.totalExpectedRepayment = loan.totalExpectedRepayment;
    this.expectedDisbursementDate = loan.expectedDisbursementDate;
    this.numberOfRepayments = loan.numberOfRepayments;
    this.loanProductName = loan.loanProductName;
    this.staffId = loan.staffId;
    this.userName = loan.userName;
    this.expectedFirstRepaymentOnDate = loan.expectedFirstRepaymentOnDate;
    this.repaymentsDueDates = loan.repaymentsDueDates;
    this.apr = loan.apr;

    this.groupId = loan.groupId ?? null;
    this.groupName = loan.groupName ?? null;

    this.applicationFee = loan.applicationFee;
    this.totalServiceFee = loan.serviceFee;
    this.installments = loan.installments;
    this.agreementForm = loan.agreementForm ?? null;
    this.disbursementDate = loan.disbursementDate ?? null;

    this.disbursedById = loan.disbursedBy?.id ?? null;
    this.disbursedByName = loan.disbursedBy?.username ?? null;

    this.officeId = loan.office?.id ?? null;
    this.officeName = loan.office?.name ?? null;

    this.inArrears = loan.inArrears;
    this.isWrittenOff = loan.isWrittenOff;
    this.statusId = loan.statusEntity?.id ?? loan.statusId;
    this.status = loan.statusEntity?.name ?? loan.status;

    this.groupPackage = loan.groupPackage?.id ?? null;

    this.schedule = loan.schedule?.map((s: LoanScheduleEntity) => ({
      id: s.id,
      dueDate: s.dueDate,
      principalDue: s.principalDue,
      interestDue: s.interestDue,
      totalDue: s.totalDue,
      status: s.status,
      installmentNumber: s.installmentNumber,
      principalPaid: s.principalPaid,
      interestPaid: s.interestPaid,
      paidDate: s.paidDate,
      groupPackage: s.groupPackage?.id ?? null,
      loan: s.loan?.id ?? null,
    })) || [];
  }
}
