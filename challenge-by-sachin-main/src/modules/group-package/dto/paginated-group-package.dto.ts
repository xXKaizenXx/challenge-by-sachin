import { ApiProperty } from '@nestjs/swagger';

export class CenterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  centerCode: string;

  constructor(partial: Partial<CenterDto>) {
    Object.assign(this, partial);
  }
}

export class OfficeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<OfficeDto>) {
    Object.assign(this, partial);
  }
}
export class PaginatedGroupPackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty({ description: 'Group package status', example: 'Pending' })
  status: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ type: () => [LoanDto] })
  loans?: LoanDto[];

  @ApiProperty({ type: () => CenterDto})
  center?: CenterDto;

  @ApiProperty({ type: () => OfficeDto})
  office?: OfficeDto;

  @ApiProperty()
  totalExpectedRepayment: number

  @ApiProperty()
  amount: string

  @ApiProperty()
  loanCount: number

  @ApiProperty({ description: 'Date/time when the group package was created', example: '2025-09-17T12:34:56.789Z' })
  createdAt: string;

  @ApiProperty({ description: 'Date/time when the group package was last updated', example: '2025-09-17T12:34:56.789Z' })
  updatedAt: string;

  constructor(partial: Partial<PaginatedGroupPackageDto>) {
    this.id = partial.id;
    this.groupId = partial.groupId;
    this.groupName = partial.groupName;
    this.status = partial.status;
    this.userId = partial.userId;
    this.username = partial.username;
    this.loans = partial.loans;
    this.center = partial.center;
    this.office = partial.office;
    this.totalExpectedRepayment = partial.totalExpectedRepayment;
    this.amount = partial.amount;
    this.loanCount = partial.loanCount;
     if (partial.createdAt) {
      this.createdAt = new Date(partial.createdAt).toISOString();
    }
    if (partial.updatedAt) {
      this.updatedAt = new Date(partial.updatedAt).toISOString();
    }
    Object.assign(this, partial);
  }
}

export class LoanDto {
  @ApiProperty()
  principal: number;

  @ApiProperty()
  totalInterest: string;

  @ApiProperty()
  expectedDisbursementDate: string;

  @ApiProperty()
  repaymentsDueDates: {
    dates?: string[];
  };

  @ApiProperty()
  installments: {
    count: number;
    amount: number;
  };

  @ApiProperty()
  status: string;

  @ApiProperty()
  businessType: string;

}
