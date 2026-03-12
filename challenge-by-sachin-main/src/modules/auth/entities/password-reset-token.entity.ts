import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../../user/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;
}
