import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abcd1234token',
    description: 'The reset token sent to the user’s email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'StrongP@ssword1',
    description: 'The new password (must meet complexity requirements)',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    example: 'StrongP@ssword1',
    description: 'Confirmation of the new password',
  })
  @IsString()
  confirmPassword: string;
}
