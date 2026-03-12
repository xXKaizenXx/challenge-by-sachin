import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
    @ApiProperty({
        description: "This is the user's email address",
        example: "user@example.com"
    })
    @IsEmail()
    email: string;
}