import { ApiProperty } from '@nestjs/swagger';
import { InterestMethod, TermUnit } from '../entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: number;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Annual interest rate' })
  interestRate: number;

  @ApiProperty({
    description: 'Interest calculation method',
    enum: InterestMethod,
  })
  interestMethod: InterestMethod;

  @ApiProperty({ description: 'Minimum loan amount', required: false })
  minAmount?: number;

  @ApiProperty({ description: 'Maximum loan amount', required: false })
  maxAmount?: number;

  @ApiProperty({ description: 'Minimum term in months', required: false })
  termMinMonths?: number;

  @ApiProperty({ description: 'Maximum term in months', required: false })
  termMaxMonths?: number;

  @ApiProperty({ description: 'Late fee amount', required: false })
  lateFee?: number;

  @ApiProperty({ description: 'Grace period in days', required: false })
  gracePeriodDays?: number;

  @ApiProperty({ description: 'Is active', required: false })
  isActive?: boolean;

  @ApiProperty({ description: 'Term length', required: false })
  termLength?: number;

  @ApiProperty({ description: 'Term unit', enum: TermUnit, required: false })
  termUnit?: TermUnit;
}
