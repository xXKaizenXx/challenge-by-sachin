import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('loan_table')
export class LoanTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  termLength: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  termUnit: string;

  @Column('int')
  loanAmount: number;

  @Column('decimal', { precision: 20, scale: 2 })
  applicationFee: number;

  @Column('decimal', { precision: 20, scale: 8 })
  totalInterest: number;

  @Column('decimal', { precision: 20, scale: 8 })
  serviceFee: number;

  @Column('int')
  installment: number;

  @Column('int')
  maximumApplicationFee: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
