import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupSystemNameDto {
  @ApiProperty({ 
    description: 'New system name for the group. Must follow the pattern: CenterCode + Number (e.g., AAA1, BBB23).',
    example: 'AAA5',
    minLength: 4,
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 10, { message: 'System name must be between 4 and 10 characters' })
  @Matches(/^[A-Z]{3}\d+$/, { 
    message: 'System name must be a 3-letter center code followed by a positive number (e.g., AAA1, BBB23)' 
  })
  systemName: string;
}