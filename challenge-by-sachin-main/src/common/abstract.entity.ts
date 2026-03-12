import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { AbstractDto } from './dtos/abstract.dto';

export interface IAbstractEntity<DTO extends AbstractDto> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export abstract class AbstractEntity<DTO extends AbstractDto = AbstractDto>
  implements IAbstractEntity<DTO>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt?: Date;
}
