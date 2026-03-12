import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDisbursementDetailDto {
  @ApiProperty({
    example: '2025-09-10',
    description: 'Date of disbursement (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsString()
  disbursementDate: string;

  //   @ApiProperty({ example: 'Bank Transfer', description: 'Payment method used for disbursement', required: false })
  //   @IsString()
  //   paymentMethod?: string;

  //   @ApiProperty({ example: 'Bulk disbursement for September', description: 'Optional notes', required: false })
  //   @IsString()
  //   notes?: string;
}

export class BulkDisburseGroupPackagesDto {
  @ApiProperty({
    example: [
      'a1b2c3d4-5678-90ab-cdef-1234567890ab',
      'b2c3d4e5-6789-01ab-cdef-2345678901bc',
    ],
    description: 'List of group package IDs to disburse',
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  groupPackageIds: string[];

  @ApiProperty({
    type: BulkDisbursementDetailDto,
    description: 'Disbursement details (Optional)',
  })
  @ValidateNested()
  @Type(() => BulkDisbursementDetailDto)
  details: BulkDisbursementDetailDto;
}
