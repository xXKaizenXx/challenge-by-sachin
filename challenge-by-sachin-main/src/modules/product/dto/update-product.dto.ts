import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { InterestMethod, TermUnit } from '../entities/product.entity';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ description: 'Annual interest rate (0.00 to 999.99)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Interest rate must be at least 0' })
  @Max(999.99, { message: 'Interest rate cannot exceed 999.99' })
  interestRate?: number;

  @ApiPropertyOptional({
    description: 'Interest calculation method',
    enum: InterestMethod,
  })
  @IsOptional()
  @IsEnum(InterestMethod, {
    message: 'Interest method must be flat, reducing_balance, or compound',
  })
  interestMethod?: InterestMethod;

  @ApiPropertyOptional({ description: 'Minimum loan amount' })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Minimum amount must be positive' })
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum loan amount' })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Maximum amount must be positive' })
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum term in months' })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Minimum term must be positive' })
  termMinMonths?: number;

  @ApiPropertyOptional({ description: 'Maximum term in months' })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Maximum term must be positive' })
  termMaxMonths?: number;

  @ApiPropertyOptional({ description: 'Late fee amount' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Late fee must be at least 0' })
  lateFee?: number;

  @ApiPropertyOptional({ description: 'Grace period in days' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Grace period must be at least 0' })
  gracePeriodDays?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Term length' })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Term length must be positive' })
  termLength?: number;

  @ApiPropertyOptional({
    description: 'Term unit',
    enum: TermUnit,
    default: TermUnit.MONTHS,
  })
  @IsOptional()
  @IsEnum(TermUnit, {
    message: 'Term unit must be days, weeks, months, or years',
  })
  termUnit?: TermUnit;
}
