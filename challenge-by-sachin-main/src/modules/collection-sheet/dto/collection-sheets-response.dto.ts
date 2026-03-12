import { Type } from 'class-transformer';
import { CollectionSheetDto } from './collection-sheet.dto';
import { PageResponseDto } from 'src/common/dtos';

export class CollectionSheetsResponseDto extends PageResponseDto<CollectionSheetDto> {
  @Type(() => CollectionSheetDto)
  data: CollectionSheetDto[];
}