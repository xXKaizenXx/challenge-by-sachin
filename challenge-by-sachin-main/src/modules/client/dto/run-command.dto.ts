import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RunCommandDto {
  @ApiProperty({
    description: 'The ID of the client to run the command on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  client: string;

  @ApiProperty({
    description: 'The command to run on the client',
    enum: ['activate', 'reactivate', 'close', 'reject', 'blacklist'],
    example: 'activate',
  })
  @IsString()
  @IsIn(['activate', 'reactivate', 'close', 'reject', 'blacklist'])
  command: string;

  @ApiProperty({
    description: 'Why the command is being run',
    example: 'Client has completed all required documentation',
  })
  @IsString()
  @IsNotEmpty()
  note: string;
}
