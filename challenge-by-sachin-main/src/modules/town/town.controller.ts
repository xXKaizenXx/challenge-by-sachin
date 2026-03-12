import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TownService } from './town.service';
import { CreateTownDto } from './dto/create-town.dto';
import { UpdateTownDto } from './dto/update-town.dto';

@Controller('api/v1/towns')
export class TownController {
  constructor(private readonly townService: TownService) {}

  @Post()
  create(@Body() createTownDto: CreateTownDto) {
    return this.townService.create(createTownDto);
  }

  @Get()
  findAll() {
    return this.townService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.townService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTownDto: UpdateTownDto) {
    return this.townService.update(id, updateTownDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.townService.remove(id);
  }
}
