import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { CenterService } from './center.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { Auth } from '../../decorators/http.decorators';
import { RoleType } from '../../constants/role-type';
import { UserEntity } from '../user/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CenterDto,
  CenterResponseDto,
  MiniCenterDto,
  MiniCenterDtoListResponseDto,
} from './dto/center.dto';
import { PageMetaDto, PageOptionsDto, PageResponseDto } from 'src/common/dtos';
import { Request } from 'express';
import {
  CenterSummaryDto,
  CenterSummaryResponseDto,
} from './dto/center-summary.dto';
import { TransferCenterDto } from './dto/transfer-center.dto';

interface MyRequest extends Request {
  user: UserEntity;
}
@ApiTags('Center')
@Controller('api/v1/centers/')
export class CenterController {
  constructor(private readonly centerService: CenterService) { }

  @Post()
  @Auth([RoleType.BRANCH_MANAGER])
  @ApiOperation({ summary: 'Create a new center' })
  @ApiResponse({
    status: 201,
    description: 'Center created successfully.',
    type: CenterDto,
  })
  create(@Body() createCenterDto: CreateCenterDto): Promise<CenterDto> {
    return this.centerService.create(createCenterDto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all centers' })
  @ApiResponse({
    status: 200,
    description: 'List of centers.',
    type: [CenterDto],
  })
  async findAll(
    @Req() req: MyRequest,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<MiniCenterDto>> {
    const [itemCount, data] = await this.centerService.findAll(
      req.user,
      pageOptionsDto,
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const centers = data.map((client) => new MiniCenterDto(client));
    const centerDto = MiniCenterDtoListResponseDto.from(centers, pageMetaDto);
    centerDto.message = 'Centers retrieved successfully';
    return centerDto;
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Get('deleted')
  async findDeleted(@Query() pageOptionsDto: PageOptionsDto): Promise<MiniCenterDtoListResponseDto> {
    const { data, meta } = await this.centerService.findDeleted(pageOptionsDto);
    const centers = data.map((center) => new MiniCenterDto(center));
    const response = MiniCenterDtoListResponseDto.from(centers, meta);
    response.message = 'Soft deleted centers retrieved successfully';
    return response;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a center by ID' })
  @ApiResponse({ status: 200, description: 'Center found.', type: CenterDto })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  async findOne(@Param('id') id: string) {
    const results = await this.centerService.findOne(id);

    const centerDto = CenterResponseDto.from(results);
    centerDto.message = 'Center retrieved successfully';
    return centerDto;
  }

  @Post('transfer')
  // @Auth([RoleType.BRANCH_MANAGER])
  @ApiOperation({ summary: 'Transfer a center from one loan officer to another' })
  @ApiResponse({ status: 200, description: 'Center transferred successfully.', type: CenterDto })
  async transferCenter(
    @Body() transferCenterDto: TransferCenterDto,
    @Req() req: Request
  ): Promise<CenterDto> {
    const { centerId, fromLoanOfficerId, toLoanOfficerId } = transferCenterDto;
    return await this.centerService.transferCenter(centerId, fromLoanOfficerId, toLoanOfficerId, req?.user);
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    await this.centerService.softDelete(id);
    return { id, softDeleted: true };
  }

  @Auth([RoleType.BRANCH_MANAGER])
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.centerService.restore(id);
    return { id, restored: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a center by ID' })
  @ApiResponse({
    status: 200,
    description: 'Center updated successfully.',
    type: CenterDto,
  })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCenterDto: UpdateCenterDto,
  ): Promise<CenterDto | null> {
    return this.centerService.update(id, updateCenterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a center by ID' })
  @ApiResponse({ status: 200, description: 'Center deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  remove(@Param('id') id: string) {
    return this.centerService.remove(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get a center summary by ID' })
  @ApiResponse({
    status: 200,
    description: 'Center summary found.',
    type: CenterSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Center summary not found.' })
  async getSummary(@Param('id') id: string) {
    const results = await this.centerService.getSummary(id);
    const centerSummaryDto = CenterSummaryResponseDto.from(results);
    centerSummaryDto.message = 'Center summary retrieved successfully';
    return centerSummaryDto;
  }
}
