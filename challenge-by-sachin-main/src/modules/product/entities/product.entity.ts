import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LoanEntity } from 'src/modules/loan/entities/loan.entity';

export enum InterestMethod {
  FLAT = 'flat',
  REDUCING_BALANCE = 'reducing_balance',
  COMPOUND = 'compound',
}

export enum TermUnit {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}

@Entity('loan_products')
export class Product {
  @ApiProperty({ description: 'Product ID' })
  @PrimaryGeneratedColumn({ name: 'product_id' })
  productId: number;

  @ApiProperty({ description: 'Product name' })
  @Column({
    name: 'product_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  productName: string;

  @ApiProperty({ description: 'Annual interest rate' })
  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 10, // changed from 5 to 10
    scale: 2,
    nullable: false,
  })
  interestRate: number;

  @ApiProperty({
    description: 'Interest calculation method',
    enum: InterestMethod,
  })
  @Column({
    name: 'interest_method',
    type: 'enum',
    enum: InterestMethod,
    nullable: false,
  })
  interestMethod: InterestMethod;

  @ApiProperty({ description: 'Minimum loan amount' })
  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  minAmount: number;

  @ApiProperty({ description: 'Maximum loan amount' })
  @Column({
    name: 'max_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maxAmount: number;

  @ApiProperty({ description: 'Minimum term in months' })
  @Column({ name: 'term_min_months', type: 'int', nullable: true })
  termMinMonths: number;

  @ApiProperty({ description: 'Maximum term in months' })
  @Column({ name: 'term_max_months', type: 'int', nullable: true })
  termMaxMonths: number;

  @ApiProperty({ description: 'Late fee amount' })
  @Column({
    name: 'late_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  lateFee: number;

  @ApiProperty({ description: 'Grace period in days' })
  @Column({ name: 'grace_period_days', type: 'int', nullable: true })
  gracePeriodDays: number;

  @ApiProperty({ description: 'Is active' })
  @Column({ name: 'is_active', type: 'boolean', nullable: true })
  isActive: boolean;

  @ApiProperty({ description: 'Term length' })
  @Column({ name: 'term_length', type: 'int', nullable: true })
  termLength: number;

  @ApiProperty({ description: 'Term unit' })
  @Column({
    name: 'term_unit',
    type: 'enum',
    enum: TermUnit,
    nullable: true,
    default: TermUnit.MONTHS,
  })
  termUnit: TermUnit;

  // @OneToMany(() => LoanEntity, (loan) => loan.loanProduct)
  // loans: LoanEntity[];
}
