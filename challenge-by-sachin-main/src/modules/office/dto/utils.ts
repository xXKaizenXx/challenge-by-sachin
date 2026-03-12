import { BadRequestException } from '@nestjs/common';
import { CreateOfficeDto } from './create-office.dto';

export const checkIfSubmittedIsHeadOffice = (
  submittedEntity: CreateOfficeDto,
  isHeadOfficeExisting,
) => {
  if (!submittedEntity?.parent && isHeadOfficeExisting) {
    throw new BadRequestException(
      'Head office already exists, parent is required',
    );
  }
};
