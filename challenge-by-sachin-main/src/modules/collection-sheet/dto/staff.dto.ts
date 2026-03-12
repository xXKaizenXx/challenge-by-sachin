import { ApiProperty } from '@nestjs/swagger';

export class StaffDto {
  @ApiProperty({ description: 'Staff (loan officer) UUID', example: 'a1b2c3d4-5678-1234-5678-abcdef123456' })
  id: string;

  @ApiProperty({ description: 'Staff name', example: 'Jane Doe' })
  name: string;
}
