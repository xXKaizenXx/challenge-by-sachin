import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import { ClientEntity } from '../entities/client.entity';
import { Language } from '../entities/client.entity';
import { Province } from '../entities/client.entity';
import { Town } from '../entities/client.entity';
import { CenterDto } from '../../center/dto/center.dto';
import { DeepPartial } from 'typeorm';
import { GroupEntity } from 'src/modules/group/entities/group.entity';
import { BaseResponseDto, PageResponseDto } from 'src/common/dtos';

import { StatusEnum } from 'src/constants/constants';
import { Type } from 'class-transformer';

// Move MiniGroupDto and MiniBankDto above their first usage
class MiniGroupDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;

  constructor(group: GroupEntity) {
    this.id = group.id;
    this.name = group.name;
  }
}

class MiniBankDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;

  constructor(bank: any) {
    this.id = bank.id;
    this.name = bank.name;
  }
}


export class ClientDto extends AbstractDto {
  @ApiProperty()
  firstName: string;

  // staffName should only be in MiniClientDto
  middleName?: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  dateOfBirth: Date;

  @ApiProperty()
  address: object;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  nationalIdNumber: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiPropertyOptional()
  emailAddress?: string;

  @ApiProperty()
  proofOfAddress: string;

  @ApiProperty()
  nationalId: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  blacklisted: boolean;

  @ApiProperty({ type: () => ({ id: String, name: String }) })
  status: { id: string; name: string };

  @ApiProperty({ type: () => ({ id: String, name: String }) })
  province?: { id: string; name: string };

  @ApiPropertyOptional({ type: () => ({ id: String, name: String }) })
  town?: { id: string; name: string };

  @ApiProperty({ type: () => ({ id: String, name: String }) })
  language: { id: string; name: string };

  @ApiProperty()
  officeId: string;

  @ApiProperty()
  staffId: string;

  @ApiPropertyOptional()
  activatedById?: string;

  @ApiProperty({
    type: () => ({ id: String, name: String, branchCode: String }),
  })
  bank: { id: string; name: string; branchCode: string };

  @ApiPropertyOptional({ type: () => MiniGroupDto })
  group?: MiniGroupDto;

  @ApiProperty()
  centerId: string;

  @ApiProperty()
  submittedOn: Date;

  @ApiPropertyOptional()
  activatedOn?: Date;

  // @ApiProperty()
  // auditData: object;

  @ApiProperty()
  staffName: string;

  @ApiProperty()
  bankAccountNumber: string;

  @ApiProperty({ type: () => CenterDto })
  center: CenterDto;

  @ApiProperty({ type: Boolean, description: 'Indicates if the client currently has an active loan.' })
  hasActiveLoan: boolean;

  @ApiProperty({ type: Boolean, description: 'Indicates if the client currently has a pending loan.' })
  hasPendingLoan: boolean;

  constructor(client: ClientEntity) {
    super(client);
    this.firstName = client.firstName;
    this.middleName = client.middleName;
    this.lastName = client.lastName;
    this.dateOfBirth = client.dateOfBirth;
    this.address = client.address;
    this.gender = client.gender;
    this.nationalIdNumber = client.nationalIdNumber;
    this.mobileNumber = client.mobileNumber;
    this.emailAddress = client.emailAddress;
    this.proofOfAddress = client.proofOfAddress;
    this.nationalId = client.nationalId;
    this.bankAccountNumber = client.bankAccountNumber;
    this.active = client.active;
    this.blacklisted = client.blacklisted;
    this.status = client.status
      ? { id: client.status.id, name: client.status.name }
      : { id: '', name: '' };
    this.province = client.province
      ? { id: client.province.id, name: client.province.name }
      : undefined;
    this.town = client.town
      ? { id: client.town.id, name: client.town.name }
      : undefined;
    this.language = client.language
      ? { id: client.language.id, name: client.language.name }
      : undefined;
    this.officeId = client.officeId;
    this.staffId = client.staffId;
    this.activatedById = client.activatedById;
    this.bank = client.bank
      ? {
        id: client.bank.id,
        name: client.bank.name,
        branchCode: client.bank.branchCode,
      }
      : { id: '', name: '', branchCode: '' };
    this.group = client.group ? new MiniGroupDto(client.group) : undefined;
    this.center = client.center;
    this.submittedOn = client.submittedOn;
    this.activatedOn = client.activatedOn;
    // this.auditData = client.auditData;
    this.staffName = client.staff
      ? `${client.staff.firstName || ''} ${client.staff.lastName || ''}`.trim()
      : '';
    this.center = client.center ? new CenterDto(client.center) : undefined;

    // Determine if client has an active loan
    this.hasActiveLoan = Array.isArray(client.loans)
      ? client.loans.some((loan) => loan.status === StatusEnum.ACTIVE)
      : false;

    // Determine if client has a pending loan
    this.hasPendingLoan = Array.isArray(client.loans)
      ? client.loans.some((loan) => loan.status === StatusEnum.PENDING)
      : false;
  }
}


export class MiniClientDto {
  @ApiPropertyOptional()
  staffName?: string;
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  middleName?: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  nationalIdNumber: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiPropertyOptional()
  emailAddress?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  bankAccountNumber: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  center?: string;

  @ApiPropertyOptional({ type: () => MiniGroupDto })
  group?: MiniGroupDto;

  @ApiProperty({ type: () => MiniBankDto })
  bank: MiniBankDto;

  @ApiProperty({ type: Boolean, description: 'Indicates if the client currently has an active loan.' })
  hasActiveLoan: boolean;

  @ApiProperty({ type: Boolean, description: 'Indicates if the client currently has a pending loan.' })
  hasPendingLoan: boolean;

  constructor(client: ClientEntity) {
    this.id = client.id;
    this.firstName = client.firstName;
    this.middleName = client.middleName;
    this.lastName = client.lastName;
    this.nationalIdNumber = client.nationalIdNumber;
    this.mobileNumber = client.mobileNumber;
    this.emailAddress = client.emailAddress;
    this.active = client.active;
    this.bankAccountNumber = client.bankAccountNumber;
    this.group = client?.group ? new MiniGroupDto(client.group) : undefined;
    this.bank = client.bank ? new MiniBankDto(client.bank) : undefined;
    this.center = client?.center ? client.center.name : undefined;
    this.status = client?.status ? client.status.name : undefined;
    this.staffName = client?.staff
      ? `${client.staff.firstName || ''} ${client.staff.lastName || ''}`.trim()
      : '';

    // Determine if client has an active loan
    this.hasActiveLoan = Array.isArray(client.loans)
      ? client.loans.some((loan) => loan.status === 'Active' || loan.status === 'Pending')
      : false;

    // Determine if client has a pending loan
    this.hasPendingLoan = Array.isArray(client.loans)
      ? client.loans.some((loan) => loan.status === 'Pending')
      : false;
  }
}

export class MiniClientDtoListResponseDto extends PageResponseDto<MiniClientDto> {
  @Type(() => MiniClientDto)
  data: MiniClientDto[];
}


