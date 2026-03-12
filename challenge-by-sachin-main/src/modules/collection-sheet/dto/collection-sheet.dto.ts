import { ApiProperty } from '@nestjs/swagger';
import { CenterDto } from './center.dto';
import { LoanDto } from './loan.dto';
import { ClientDto } from './client.dto';
// import { GroupDto } from './group.dto';
import { StaffDto } from './staff.dto';
import { AbstractDto } from 'src/common/dtos';

export class CollectionSheetDto extends AbstractDto {
  @ApiProperty({ description: 'Loan schedule ID', example: 'scheduleId' })
  id: string;

  @ApiProperty({ description: 'Due date for repayment', example: '2025-09-07' })
  dueDate: string;

  @ApiProperty({ description: 'Staff (loan officer) entity', type: () => StaffDto })
  staff: StaffDto;

  @ApiProperty({ description: 'Center entity', type: () => CenterDto })
  center: CenterDto;

  @ApiProperty({ description: 'Loan entity', type: () => LoanDto })
  loan: LoanDto;

  @ApiProperty({ description: 'Client entity', type: () => ClientDto })
  client: ClientDto;

  // @ApiProperty({ description: 'Group entity', type: () => GroupDto })
  // group: GroupDto;

  @ApiProperty({ description: 'Amount due', example: 1000.00 })
  totalDue: number;

  @ApiProperty({ description: 'Status of the schedule', example: 'PENDING' })
  status: string;
}
