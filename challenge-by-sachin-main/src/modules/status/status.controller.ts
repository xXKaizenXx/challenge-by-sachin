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
import { PageMetaDto, PageOptionsDto, PageResponseDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';
import { Auth } from 'src/decorators';
import { TypeOrmUniqueExceptionFilter } from 'src/filters/typeorm-unique-exception.filter';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusDto } from './dto/status.dto';
import { StatusService } from './status.service';

@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/statuses')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Auth([RoleType.SUPER_USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStatusDto: CreateStatusDto): Promise<StatusDto> {
    const status = await this.statusService.create(createStatusDto);
    return new StatusDto(status);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    const { data, meta } = await this.statusService.findAll(pageOptionsDto);
    const statusDtos = data.map((status) => new StatusDto(status));
    return { data: statusDtos, meta };
  }



  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.statusService.findDeleted(query);
    return PageResponseDto.from(data, meta, 'Soft-deleted statuses retrieved successfully', true);
  }
  
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<StatusDto> {
    const status = await this.statusService.findOne(id);
    return new StatusDto(status);
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<StatusDto> {
    const status = await this.statusService.update(id, updateStatusDto);
    return new StatusDto(status);
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.statusService.remove(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.statusService.softDelete(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<void> {
    await this.statusService.restore(id);
  }
}
