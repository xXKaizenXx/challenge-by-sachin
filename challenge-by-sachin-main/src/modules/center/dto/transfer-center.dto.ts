import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferCenterDto {
  @ApiProperty({ description: 'Center ID to transfer' })
  @IsUUID()
  centerId: string;

  @ApiProperty({ description: 'Current loan officer ID' })
  @IsUUID()
  fromLoanOfficerId: string;

  @ApiProperty({ description: 'New loan officer ID' })
  @IsUUID()
  toLoanOfficerId: string;
}
