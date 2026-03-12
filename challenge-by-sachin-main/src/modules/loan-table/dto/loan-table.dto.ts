import { ApiProperty } from '@nestjs/swagger';
import { LoanTable } from '../entities/loan-table.entity';

export class LoanTableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loanAmount: number;

  @ApiProperty()
  applicationFee: number;

  @ApiProperty()
  totalInterest: number;

  @ApiProperty()
  serviceFee: number;

  @ApiProperty()
  installment: number;

  @ApiProperty()
  maximumApplicationFee: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(entity: LoanTable) {
    this.id = entity.id;
    this.loanAmount = entity.loanAmount;
    this.applicationFee = Number(entity.applicationFee);
    this.totalInterest = Number(entity.totalInterest);
    this.serviceFee = Number(entity.serviceFee);
    this.installment = entity.installment;
    this.maximumApplicationFee = entity.maximumApplicationFee;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
