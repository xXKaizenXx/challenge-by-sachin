import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CollectionSheetFilterDto {
  @ApiPropertyOptional({ description: 'Start date for due repayments (YYYY-MM-DD)', example: new Date() })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for due repayments (YYYY-MM-DD)', example: new Date() })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Center UUID' })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiPropertyOptional({ description: 'Loan officer UUID' })
  @IsOptional()
  @IsString()
  staffId?: string;
  @ApiPropertyOptional({ description: "Group UUID" })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({
    description: "Grouping key (center, staff, group, client, office)",
    enum: ["center", "staff", "group", "client", "office"],
    example: "center"
  })
  @IsOptional()
  @IsString()
  grouping?: string;
}
