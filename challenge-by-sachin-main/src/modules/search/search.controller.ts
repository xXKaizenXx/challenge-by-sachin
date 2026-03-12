import {
  Controller,
  Get,
  Query,
  UseFilters,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResponseDto } from './dto';
import { Auth } from '../../decorators/http.decorators';
import { RoleType } from '../../constants/role-type';
import { UserEntity } from '../user/user.entity';
import { TypeOrmUniqueExceptionFilter } from '../../filters/typeorm-unique-exception.filter';

interface SearchRequest extends Request {
  user: UserEntity;
}

@ApiTags('Search')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Scoped Search Across Portfolio Resources',
    description: 'Search API allows scoped search across portfolio resources (centers, groups, staff, clients) within the user\'s office and portfolio access. Returns minimal data for each resource type.'
  })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async search(
    @Query() searchQuery: SearchQueryDto,
    @Req() req: SearchRequest,
  ): Promise<SearchResponseDto> {
    return await this.searchService.search(searchQuery, req.user);
  }
}