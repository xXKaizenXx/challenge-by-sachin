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
import { OfficeService } from './office.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { Auth } from 'src/decorators';
import { UserEntity } from '../user/user.entity';
import { OfficeDto, OfficeResponseDto } from './dto/office.dto';
import { PageOptionsDto, PageResponseDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';

interface IRequest {
  user: UserEntity;
}

@Controller('api/v1/offices')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) { }

  @Auth([RoleType.SUPER_USER])
  @Post()
  async create(@Body() createOfficeDto: CreateOfficeDto) {
    const office = await this.officeService.create(createOfficeDto);
    const officeDto = new OfficeDto(office);
    const officeResponse = OfficeResponseDto.from(officeDto);

    officeResponse.message = 'Office created successfully';
    return officeResponse;
  }

  @Auth()
  @Get()
  async findAll(@Req() req: IRequest) {
    const offices = await this.officeService.findAll(req.user);
    const officeDto = offices.map((office) => new OfficeDto(office));
    const officesResponse = OfficeResponseDto.from(officeDto);

    officesResponse.message = 'Offices retrieved successfully';
    return officesResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  async findDeleted(@Query() query: PageOptionsDto) {
    const { data, meta } = await this.officeService.findDeleted(query);
    const officeDto = data.map((office) => new OfficeDto(office));
    return PageResponseDto.from(officeDto, meta, 'Soft-deleted offices retrieved successfully', true);
  }

  @Auth()
  @Get('/parent')
  async getOfficesByParent(@Query('parent_id') parent_id: string) {
    const offices = await this.officeService.findOfficesByParent(parent_id);

    const officesDto = offices.map((office) => new OfficeDto(office));
    const officesResponse = OfficeResponseDto.from(officesDto);

    officesResponse.message = 'Offices retrieved successfully';
    return officesResponse;
  }

  @Auth()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const office = await this.officeService.findOne(id);
    const officeDto = new OfficeDto(office);
    const officesResponse = OfficeResponseDto.from(officeDto);

    officesResponse.message = 'Office retrieved successfully';
    return officesResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ) {
    const office = await this.officeService.update(id, updateOfficeDto);

    const officeDto = new OfficeDto(office);
    const officesResponse = OfficeResponseDto.from(officeDto);

    officesResponse.message = 'Office updated successfully';
    return officesResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const office = await this.officeService.delete(id);

    const officeDto = new OfficeDto(office);
    const officesResponse = OfficeResponseDto.from(officeDto);

    officesResponse.message = 'Office deleted successfully';

    return officesResponse;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    await this.officeService.softDelete(id);
    return { id, softDeleted: true };
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.officeService.restore(id);
    return { id, restored: true };
  }

  @Get('/health-check')
  healthCheck() {
    return {
      success: true,
      message: 'status successful',
      data: {
        check: true,
        status: 'UP',
      },
    };
  }
}
