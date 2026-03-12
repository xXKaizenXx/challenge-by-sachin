import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Order, RoleType } from 'src/constants';
import { IsString } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({ enum: Order, default: Order.DESC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({ description: 'Filter by status (e.g., active, pending)' })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: 'Filter by name' })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({ description: 'Filter by user (Loan Officer)' })
  @IsString()
  @IsOptional()
  readonly userId?: string;


  @ApiPropertyOptional({ enum: RoleType, description: 'Filter users by role' })
  @IsEnum(RoleType)
  @IsOptional()
  readonly role?: RoleType;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly take?: number = 20;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
