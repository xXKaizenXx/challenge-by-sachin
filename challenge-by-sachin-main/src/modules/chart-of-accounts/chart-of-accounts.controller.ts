import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageMetaDto, PageOptionsDto } from '../../common/dtos';
import { RoleType } from '../../constants';
import { Auth } from '../../decorators';
import { TypeOrmUniqueExceptionFilter } from '../../filters/typeorm-unique-exception.filter';
import { ChartOfAccountsDto } from './dto/chart-of-accounts.dto';
import { ChartOfAccountsResponseDto } from './dto/chart-of-accounts-response.dto';
import { ChartOfAccountsListResponseDto } from './dto/chart-of-accounts-list-response.dto';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';
import { ChartOfAccountsService } from './chart-of-accounts.service';

@ApiTags('Chart of Accounts')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/chart-of-accounts')
export class ChartOfAccountsController {
  constructor(
    private readonly chartOfAccountsService: ChartOfAccountsService,
  ) { }

  @Auth([RoleType.SUPER_USER])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all chart of accounts' })
  @ApiResponse({ status: 200, description: 'List of chart of accounts.' })
  async getChartOfAccountsList(@Query() pageOptionsDto: PageOptionsDto) {
    const [itemCount, data] =
      await this.chartOfAccountsService.getChartOfAccountsList(pageOptionsDto);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const accounts = data.map((account) => new ChartOfAccountsDto(account));
    const response = ChartOfAccountsListResponseDto.from(accounts, pageMetaDto);
    response.message = 'Chart of accounts retrieved successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all soft deleted chart of accounts (paginated)' })
  @ApiResponse({ status: 200, description: 'List of soft deleted chart of accounts.' })
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.chartOfAccountsService.findDeleted(query);
    const accounts = data.map((account) => new ChartOfAccountsDto(account));
    // Use PageResponseDto for paginated response
    return {
      success: true,
      message: 'Soft-deleted chart of accounts retrieved successfully',
      data: accounts,
      metaData: meta,
    };
  }

  @Auth([RoleType.SUPER_USER])
  @Get('hierarchy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get chart of accounts hierarchy' })
  @ApiResponse({ status: 200, description: 'Chart of accounts hierarchy.' })
  async getChartOfAccountsHierarchy() {
    const data =
      await this.chartOfAccountsService.getChartOfAccountsHierarchy();
    const accounts = data.map((account) => new ChartOfAccountsDto(account));
    const response = ChartOfAccountsListResponseDto.from(
      accounts,
      new PageMetaDto({
        itemCount: accounts.length,
        pageOptionsDto: new PageOptionsDto(),
      }),
    );
    response.message = 'Chart of accounts hierarchy retrieved successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Get('type/:accountType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get accounts by type' })
  @ApiResponse({ status: 200, description: 'Accounts by type.' })
  async getAccountsByType(@Param('accountType') accountType: string) {
    const data = await this.chartOfAccountsService.getAccountsByType(
      accountType,
    );
    const accounts = data.map((account) => new ChartOfAccountsDto(account));
    const response = ChartOfAccountsListResponseDto.from(
      accounts,
      new PageMetaDto({
        itemCount: accounts.length,
        pageOptionsDto: new PageOptionsDto(),
      }),
    );
    response.message = 'Accounts by type retrieved successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a chart of accounts by ID' })
  @ApiResponse({ status: 200, description: 'Chart of accounts found.' })
  @ApiResponse({ status: 404, description: 'Chart of accounts not found.' })
  async getChartOfAccounts(
    @Param('id') id: string,
  ): Promise<ChartOfAccountsResponseDto> {
    const account = await this.chartOfAccountsService.getChartOfAccounts(id);
    const accountDto = new ChartOfAccountsDto(account);
    const response = ChartOfAccountsResponseDto.from(accountDto);
    response.message = 'Chart of accounts retrieved successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chart of accounts' })
  @ApiResponse({
    status: 201,
    description: 'Chart of accounts created successfully.',
  })
  async createChartOfAccounts(
    @Body() createChartOfAccountsDto: CreateChartOfAccountsDto,
  ): Promise<ChartOfAccountsResponseDto> {
    const account = await this.chartOfAccountsService.createChartOfAccounts(
      createChartOfAccountsDto,
    );
    const accountDto = new ChartOfAccountsDto(account);
    const response = ChartOfAccountsResponseDto.from(accountDto);
    response.message = 'Chart of accounts created successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a chart of accounts by ID' })
  @ApiResponse({
    status: 200,
    description: 'Chart of accounts updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Chart of accounts not found.' })
  async updateChartOfAccounts(
    @Param('id') id: string,
    @Body() updateChartOfAccountsDto: UpdateChartOfAccountsDto,
  ): Promise<ChartOfAccountsResponseDto> {
    const account = await this.chartOfAccountsService.updateChartOfAccounts(
      id,
      updateChartOfAccountsDto,
    );
    const accountDto = new ChartOfAccountsDto(account);
    const response = ChartOfAccountsResponseDto.from(accountDto);
    response.message = 'Chart of accounts updated successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chart of accounts by ID' })
  @ApiResponse({
    status: 204,
    description: 'Chart of accounts deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Chart of accounts not found.' })
  async deleteChartOfAccounts(@Param('id') id: string): Promise<void> {
    await this.chartOfAccountsService.deleteChartOfAccounts(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a chart of accounts by ID' })
  @ApiResponse({
    status: 204,
    description: 'Chart of accounts soft deleted successfully.',
  })
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.chartOfAccountsService.softDelete(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a soft deleted chart of accounts by ID' })
  @ApiResponse({
    status: 204,
    description: 'Chart of accounts restored successfully.',
  })
  async restore(@Param('id') id: string): Promise<void> {
    await this.chartOfAccountsService.restore(id);
  }
}
