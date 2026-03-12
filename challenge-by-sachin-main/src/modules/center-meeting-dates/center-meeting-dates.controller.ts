import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CenterMeetingDatesService } from './center-meeting-dates.service';
import { CreateCenterMeetingDatesDto } from './dto/create-center-meeting-dates.dto';
import { UpdateCenterMeetingDatesDto } from './dto/update-center-meeting-dates.dto';
import { PageOptionsDto, PageResponseDto } from 'src/common/dtos';

@Controller('api/v1/center-meeting-dates')
export class CenterMeetingDatesController {
  constructor(
    private readonly centerMeetingDatesService: CenterMeetingDatesService,
  ) {}

  @Post()
  create(@Body() dto: CreateCenterMeetingDatesDto) {
    return this.centerMeetingDatesService.create(dto);
  }

  @Get()
  findAll() {
    return this.centerMeetingDatesService.findAll();
  }

  @Get('deleted')
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.centerMeetingDatesService.findDeleted(query);
    return PageResponseDto.from(data, meta, 'Soft-deleted center meeting dates retrieved successfully', true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.centerMeetingDatesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCenterMeetingDatesDto) {
    return this.centerMeetingDatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.centerMeetingDatesService.remove(id);
  }
}
