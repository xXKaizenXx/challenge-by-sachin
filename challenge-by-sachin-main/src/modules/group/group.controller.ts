import { GroupService } from './group.service';
import { AddClientsToGroupDto } from './dto/add-clients-to-group.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateGroupSystemNameDto } from './dto/update-group-system-name.dto';
import { UpdateGroupSystemNameResponseDto } from './dto/update-group-system-name-response.dto';
import { Auth } from '../../decorators/http.decorators';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleType } from '../../constants/role-type';
import { TypeOrmUniqueExceptionFilter } from '../../filters/typeorm-unique-exception.filter';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  GroupDto,
  GroupSummaryDto,
  MiniGroupDtoListResponseDto,
  MiniGroupsDto,
} from './dto/group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { UserEntity } from '../user/user.entity';
import { GroupFiltersDto } from './dto/group-filters.dto';

interface GenericMyRequest<T> extends Request {
  query: T;
  user: UserEntity;
}

@ApiTags('Group')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/groups')
@UseGuards(AuthGuard(), RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post(':id/add-clients')
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Add clients to a group' })
  @ApiResponse({ status: 200, description: 'Clients added to group successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request or validation failed.' })
  @ApiResponse({ status: 403, description: 'clients already in another group.' })
  @ApiResponse({ status: 404, description: 'Group or clients not found.' })
  async addClientsToGroup(
    @Param('id') id: string,
    @Body() addClientsDto: AddClientsToGroupDto,
    @Request() req,
  ) {
    return this.groupService.addClientsToGroup(id, addClientsDto.clientIds, req.user);
  }

  @Post()
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  create(@Body() createGroupDto: CreateGroupDto, @Request() req) {
    return this.groupService.create(createGroupDto, req.user);
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all groups',
    description:
      'Returns a list of groups. Supports filtering by status (e.g., active, inactive).',
  })
  @ApiResponse({ status: 200, description: 'List of groups.' })
  @ApiResponse({ status: 400, description: 'Invalid status value.' })
  async getGroups(
    @Request() req: GenericMyRequest<GroupFiltersDto>,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const { itemCount, data } = await this.groupService.getGroups({
      user: req.user,
      filters: req.query,
      pageOptionsDto,
    });
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const groups = data.map((group) => new GroupDto(group));
    const groupDto = GroupsResponseDto.from(groups, pageMetaDto);

    groupDto.message = 'Groups retrieved successfully';
    return groupDto;
  }

  @Get('center/:centerId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all groups by center ID' })
  @ApiResponse({ status: 200, description: 'List of groups.' })
  async getGroupsByCenter(
    @Param('centerId') centerId: string,
    @Request() req,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const [itemCount, data] = await this.groupService.getGroupsByCenter(
      centerId,
      pageOptionsDto,
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const groups = data.map((group) => new MiniGroupsDto(group));
    const groupDto = MiniGroupDtoListResponseDto.from(groups, pageMetaDto);
    groupDto.message = 'Groups retrieved successfully';
    return groupDto;
  }
  @Get('summary')
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Get all groups (id, name, systemName only)' })
  @ApiResponse({
    status: 200,
    description: 'List of groups.',
    type: [GroupSummaryDto],
  })
  async getGroupsSummary(@Request() req): Promise<GroupSummaryDto[]> {
    return this.groupService.findAllSummary(req.user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiResponse({ status: 200, description: 'Group found.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async findOne(@Param('id') id: string, @Request() req) {
    const group = await this.groupService.findOne(id, req.user);
    return new GroupResponseDto(group);
  }

  @Patch(':id')
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Update a group by ID' })
  @ApiResponse({ status: 200, description: 'Group updated successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req,
  ) {
    return this.groupService.update(id, updateGroupDto, req.user);
  }

  @Delete(':id')
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Delete a group by ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.groupService.remove(id, req.user);
  }

  @Post(':id/activate')
  @Auth([RoleType.BRANCH_MANAGER])
  @ApiOperation({ summary: 'Activate a group by ID' })
  @ApiResponse({ status: 200, description: 'Group activated successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  activate(@Param('id') id: string, @Request() req) {
    return this.groupService.activate(id, req.user);
  }

  @Post(':id/deactivate')
  @Auth([RoleType.LOAN_OFFICER])
  @ApiOperation({ summary: 'Deactivate a group by ID' })
  @ApiResponse({ status: 200, description: 'Group deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.groupService.deactivate(id, req.user);
  }

  @Patch(':id/system-name')
  @Auth([RoleType.SUPER_USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update group system name (Super User only)',
    description:
      'Updates the system name of a group. The new name must start with the center code and be unique across all groups.',
  })
  @ApiResponse({
    status: 200,
    description: 'Group system name updated successfully.',
    type: UpdateGroupSystemNameResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error - system name must start with center code or already exists.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only super users can update system names.',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found.',
  })
  async updateSystemName(
    @Param('id') id: string,
    @Body() updateGroupSystemNameDto: UpdateGroupSystemNameDto,
    @Request() req,
  ) {
    return this.groupService.updateSystemName(
      id,
      updateGroupSystemNameDto,
      req.user,
    );
  }
}
