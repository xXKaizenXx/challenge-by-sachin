import { ApiProperty } from '@nestjs/swagger';

export class ClientDto {
  @ApiProperty({ description: 'Client ID', example: 'clientId' })
  id: string;

  @ApiProperty({ description: 'Client name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Client mobile number', example: '+209876543213' })
  mobileNumber: string

  @ApiProperty({ description: 'Client mobile number', example: '09784302322' })
  bankAccountNumber: string;
}
