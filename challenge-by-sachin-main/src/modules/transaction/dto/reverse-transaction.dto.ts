import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../user/user.entity';

export class ReverseTransactionDto {
  @ApiProperty({
    description: 'ID of the transaction to reverse',
    example: 'a1b2c3d4-5678-90ef-gh12-3456ijkl7890',
  })
  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Reason for reversal / audit purposes',
    example: 'Customer requested refund due to overpayment',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Authenticated user performing the reversal',
    type: () => UserEntity,
  })
  user?: UserEntity;
}
