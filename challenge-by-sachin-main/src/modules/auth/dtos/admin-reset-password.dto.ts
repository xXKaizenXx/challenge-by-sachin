import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({ example: 'username@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  // Add your password policy regex if needed
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
    { message: 'Password too weak' })
  newPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  confirmPassword: string;
}
