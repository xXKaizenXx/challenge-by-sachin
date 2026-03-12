import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { AuditStatus } from '../../../constants/audit-status';

@Entity('audits')
@Index(['auditableType', 'auditableId'])
@Index(['auditableType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['event'])
@Index(['createdAt'])
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  auditableType: string; // e.g., 'User', 'Loan', etc.

  @Column()
  auditableId: string; // ID of the entity

  @Column()
  event: string; // 'created', 'updated', 'deleted'

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  status: AuditStatus;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ nullable: true })
  userId: string; // Who made the change

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;
}
