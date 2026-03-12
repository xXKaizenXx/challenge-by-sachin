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
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { GenderService } from './gender.service';

@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/genders')
export class GenderController {
  constructor(private readonly genderService: GenderService) { }

  @Auth([RoleType.SUPER_USER])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGenderDto: CreateGenderDto) {
    const gender = await this.genderService.create(createGenderDto);
    return gender;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return await this.genderService.findAll(pageOptionsDto);
  }

  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.genderService.findDeleted(query);
    return PageResponseDto.from(data, meta, 'Soft-deleted genders retrieved successfully', true);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const gender = await this.genderService.findOne(id);
    return gender;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateGenderDto: UpdateGenderDto,
  ) {
    const gender = await this.genderService.update(id, updateGenderDto);
    return gender;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.genderService.remove(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.genderService.softDelete(id);
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<void> {
    await this.genderService.restore(id);
  }
}
