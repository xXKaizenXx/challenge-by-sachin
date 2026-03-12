import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min, IsBoolean, IsString } from 'class-validator';
import { Order } from 'src/constants/order';

export class LoanQueryDto {
    @ApiPropertyOptional({ enum: Order, description: 'Sort order (ASC or DESC)', default: Order.DESC })
    @IsOptional()
    @IsEnum(Order)
    order?: Order = Order.DESC;

    @ApiPropertyOptional({ description: 'Loan status', enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Closed', 'Active', 'Awaiting Disbursement'] })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    take?: number = 20;

    @ApiPropertyOptional({ description: 'Branch Manager Approved', type: 'boolean' })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
    bmApproved?: boolean;

    @ApiPropertyOptional({ description: 'Credit Manager Approved', type: 'boolean' })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
    cmApproved?: boolean;

    get skip(): number {
        return ((this.page ?? 1) - 1) * (this.take ?? 20);
    }
}
