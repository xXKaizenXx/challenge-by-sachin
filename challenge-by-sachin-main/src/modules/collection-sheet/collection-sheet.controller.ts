import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CollectionSheetService } from './collection-sheet.service';
import { CreateCollectionSheetDto } from './dto/create-collection-sheet.dto';
import { UpdateCollectionSheetDto } from './dto/update-collection-sheet.dto';
import { CollectionSheetFilterDto } from './dto/collection-sheet-filter.dto';
import { Auth } from 'src/decorators';
import { RoleType } from 'src/constants';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { CollectionSheetDto } from './dto/collection-sheet.dto';
import { CollectionSheetsResponseDto } from './dto/collection-sheets-response.dto';

@ApiTags('Collection Sheet')
@Controller('api/v1/collection-sheet')
export class CollectionSheetController {
  constructor(
    private readonly collectionSheetService: CollectionSheetService,
  ) { }

  // Logging utility for controller
  private log(message: string, data?: any) {
    console.log(`[CollectionSheetController] ${message}`, data ?? '');
  }

  /**
   * Get collection sheet with filters
   */
  @Auth([RoleType.LOAN_OFFICER,
  RoleType.IT,
  RoleType.BRANCH_MANAGER,
  RoleType.SUPER_USER
  ])
  @HttpCode(HttpStatus.CREATED)
  @Get('/')
  @ApiOperation({ summary: 'Get collection sheet with filters' })
  @ApiResponse({ status: 200, description: 'Filtered collection sheet' })
  async getCollectionSheet(
    @Query() filters: CollectionSheetFilterDto,
    @Query() pageOptionsDto: PageOptionsDto,
    @Req() req,
  ) {
    this.log('Fetching collection sheet with filters', filters);
    const { itemCount, data } = await this.collectionSheetService.getCollectionSheet(filters, pageOptionsDto, req);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    // Return grouped data by center and group directly
    const responseDto = CollectionSheetsResponseDto.from(data, pageMetaDto);
    responseDto.message = 'Collection sheets retrieved successfully';
    this.log('Response DTO', responseDto);
    return responseDto;
  }

}
