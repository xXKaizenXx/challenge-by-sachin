import {
  AbstractEntity,
  IAbstractEntity,
} from '../../../common/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/user.entity';
import { OfficeDto } from '../dto/office.dto';
import { LoanEntity } from 'src/modules/loan/entities/loan.entity';
export interface IOfficeEntity extends IAbstractEntity<OfficeDto> {
  name: string;

  openingDate: Date;

  parent: OfficeEntity | null;

  children?: OfficeEntity[];
}

@Entity({ name: 'offices' })
export class OfficeEntity
  extends AbstractEntity<OfficeDto>
  implements IOfficeEntity
{
  @Column({ unique: true })
  name: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  openingDate: Date;

  @OneToMany(() => OfficeEntity, (office) => office.parent)
  children: OfficeEntity[];

  @ManyToOne(() => OfficeEntity, (office) => office.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: OfficeEntity;

  @OneToMany(() => UserEntity, (user) => user.office)
  users: UserEntity[];

  @OneToMany(() => LoanEntity, (loan) => loan.office)
  loans: LoanEntity[];
}
