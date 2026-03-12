import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseFilters,
} from '@nestjs/common';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';
import { Auth } from 'src/decorators';
import { UserDto, UserResponseDto } from './dtos/user.dto';
import { UsersResponseDto } from './dtos/users-response.dto';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { TypeOrmUniqueExceptionFilter } from 'src/filters/typeorm-unique-exception.filter';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LoanOfficerMetricsResponseDto } from './dtos/loan-officer-metrics.dto';

@ApiTags('User')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER, RoleType.CREDIT])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users.' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: RoleType,
    description: 'Filter users by role',
  })
  async getUsers(@Query() pageOptionsDto: PageOptionsDto) {
    console.log('HIT', pageOptionsDto);
    const [itemCount, data] = await this.userService.getUsers(pageOptionsDto);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const users = data.map((user) => new UserDto(user));
    const userDto = UsersResponseDto.from(users, pageMetaDto);
    userDto.message = 'Users retrieved successfully';
    return userDto;
  }


  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all soft deleted users' })
  @ApiResponse({ status: 200, description: 'List of soft deleted users.' })
  async getDeletedUsers(@Query() pageOptionsDto: PageOptionsDto): Promise<UsersResponseDto> {
  const { data, meta } = await this.userService.getDeletedUsers(pageOptionsDto);
  const userDtos = data.map((user) => new UserDto(user));
  const usersResponse = UsersResponseDto.from(userDtos, meta);
  usersResponse.message = 'Soft deleted users retrieved successfully';
  return usersResponse; 
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER, RoleType.CREDIT])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.getUser(id);
    const userDto = new UserDto(user);
    const userResponse = UserResponseDto.from(userDto);
    userResponse.message = 'User retrieved successfully';
    return userResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto);
    const userDto = new UserDto(user);
    const userResponse = UserResponseDto.from(userDto);
    userResponse.message = 'User retrieved successfully';
    return userResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, updateUserDto);
    const userDto = new UserDto(user);
    const userResponse = UserResponseDto.from(userDto);
    userResponse.message = 'User updated successfully';
    return userResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id/soft-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async softDeleteUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.softDeleteUser(id);
    const userDto = new UserDto(user);
    const userResponse = UserResponseDto.from(userDto);
    userResponse.message = 'User soft deleted successfully';
    return userResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft deleted user by ID' })
  @ApiResponse({ status: 200, description: 'User restored successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async restoreUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.restoreUser(id);
    const userDto = new UserDto(user);
    const userResponse = UserResponseDto.from(userDto);
    userResponse.message = 'User restored successfully';
    return userResponse;
  }

  @Auth([RoleType.LOAN_OFFICER])
  @Get('loan-officer/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get metrics for loan officer' })
  @ApiResponse({ status: 200, description: 'Loan officer metrics retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'User is not a loan officer.' })
  async getMyMetrics(@Request() req): Promise<LoanOfficerMetricsResponseDto> {
    const metrics = await this.userService.getLoanOfficerMetrics(req.user.id);
    const response = LoanOfficerMetricsResponseDto.from(metrics);
    response.message = 'Loan officer metrics retrieved successfully';
    return response;
  }
}
