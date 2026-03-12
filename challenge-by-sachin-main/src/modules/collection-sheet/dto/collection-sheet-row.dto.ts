import { ApiProperty } from '@nestjs/swagger';

export class CollectionSheetRowDto {
    @ApiProperty({
        example: 'loan-123',
        description: 'Unique identifier for the loan',
    })
    loanId: string;

    @ApiProperty({
        example: 'group-456',
        description: 'Unique identifier for the group',
    })
    groupId: string;

    @ApiProperty({
        example: 'Alpha Group',
        description: 'Name of the group',
    })
    groupName: string;

    @ApiProperty({
        example: 'center-789',
        description: 'Unique identifier for the center',
    })
    centerId: string;

    @ApiProperty({
        example: 'Downtown Center',
        description: 'Name of the center',
    })
    centerName: string;

    @ApiProperty({
        example: 'staff-101',
        description: 'Unique identifier for the staff member',
    })
    staffId: string;

    @ApiProperty({
        example: 'Jane Doe',
        description: 'Name of the staff member',
    })
    staffName: string;

    @ApiProperty({
        example: 'client-202',
        description: 'Unique identifier for the client',
    })
    clientId: string;

    @ApiProperty({
        example: 'John Smith',
        description: 'Name of the client',
    })
    clientName: string;

    @ApiProperty({
        example: '2024-06-15',
        description: 'Due date for the payment (YYYY-MM-DD)',
    })
    dueDate: string;

    @ApiProperty({
        example: 500.0,
        description: 'Principal amount due',
    })
    principalDue: number;

    @ApiProperty({
        example: 550.0,
        description: 'Total amount due including interest and fees',
    })
    totalDue: number;

    @ApiProperty({
        example: 'pending',
        description: 'Status of the collection sheet row',
    })
    status: string;
}
