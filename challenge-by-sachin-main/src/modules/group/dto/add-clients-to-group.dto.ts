import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class AddClientsToGroupDto {
    @ApiProperty({
        description: 'Array of client IDs to add to the group',
        example: ['client_1', 'client_2', 'client_3'],
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsString({ each: true })
    clientIds: string[];
}
