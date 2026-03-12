import { ApiProperty } from '@nestjs/swagger';

export class GroupWithRelationsDto {
  @ApiProperty({ description: 'ID of the client added to the group' })
  clientId: string;

  @ApiProperty({ description: 'Client full name' })
  clientName: string;

  @ApiProperty({ description: 'Client mobile number', required: false })
  mobileNumber?: string;

  @ApiProperty({ description: 'Client email address', required: false })
  emailAddress?: string;

  @ApiProperty({ description: 'Group ID' })
  groupId: string;

  @ApiProperty({ description: 'Date client was added to group' })
  addedAt: Date;
}
