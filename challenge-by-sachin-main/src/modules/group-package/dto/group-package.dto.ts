import { ApiProperty } from '@nestjs/swagger';
import { GroupPackageEntity } from '../entities/group-package.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { LoanScheduleEntity } from 'src/modules/loan-schedule/entities/loan-schedule.entity';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

export class GroupPackageDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'g1h2i3j4-5678-90ab-cdef-1234567890ab' })
  groupId: string;

  @ApiProperty({ example: 'Group Alpha' })
  groupName: string;

  @ApiProperty({ example: 'u1v2w3x4-5678-90ab-cdef-1234567890ab' })
  userId: string;

  @ApiProperty({ example: 'loanofficer1' })
  username: string;

  @ApiProperty({
    type: () => [Object],
    example: [
      {
        principal: 1000,
        totalInterest: 100,
        expectedDisbursementDate: '2025-09-10',
        repaymentsDueDates: { '1': '2025-10-10' },
        installments: { '1': 250 },
        status: 'approved',
        businessType: 'Retail',
      },
    ],
  })
  loans: any[];

  @ApiProperty({ example: 'approved' })
  status: string;

  @ApiProperty({ example: '2025-09-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-10T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'branchmanager1' })
  approvedBy: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  @ApiProperty({ example: 1100 })
  totalExpectedRepayment: number;

  @ApiProperty({ example: 'o1p2q3r4-5678-90ab-cdef-1234567890ab' })
  officeId: string;

  @ApiProperty({ example: { '1': '2025-10-10', '2': '2025-11-10' } })
  repaymentDates: object;

  constructor(entity: GroupPackageEntity) {
    this.id = entity.id;
    this.groupId = entity.groupId;
    this.groupName = entity.groupName;
    this.userId = entity.userId;
    this.username = entity.username;
    this.loans = entity.loans
      ? entity.loans.map((l: LoanEntity) => {
          return {
            principal: l.principal,
            totalInterest: l.totalInterest,
            expectedDisbursementDate: l.expectedDisbursementDate,
            repaymentsDueDates: l.repaymentsDueDates,
            installments: l.installments,
            status: l.status?.toLowerCase(),
            businessType: l.businessType,
          };
        })
      : [];
    this.status = entity.status;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    this.approvedBy = entity.approvedBy;
    this.amount = entity.amount;
    this.totalExpectedRepayment = entity.totalExpectedRepayment;
    this.officeId = entity.officeId;
    this.repaymentDates = entity?.loans[0]?.repaymentsDueDates;
  }
}

export class GroupPackageResponseDto extends BaseResponseDto<GroupPackageDto> {
  static fromGroupPackage(
    groupPackage: GroupPackageDto | null,
    message = '',
  ): GroupPackageResponseDto {
    return BaseResponseDto.from(
      groupPackage,
      !!groupPackage,
      message,
    ) as GroupPackageResponseDto;
  }
}
