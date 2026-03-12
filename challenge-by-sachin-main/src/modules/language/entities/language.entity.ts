import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}
