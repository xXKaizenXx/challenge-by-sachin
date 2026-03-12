import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AudoRepaymentsService } from './audo-repayments.service';
import { CreateAudoRepaymentDto } from './dto/create-audo-repayment.dto';
import { UpdateAudoRepaymentDto } from './dto/update-audo-repayment.dto';

@Controller('audo-repayments')
export class AudoRepaymentsController {
  constructor(private readonly audoRepaymentsService: AudoRepaymentsService) {}

  @Post()
  create(@Body() createAudoRepaymentDto: CreateAudoRepaymentDto) {
    return this.audoRepaymentsService.create(createAudoRepaymentDto);
  }

  @Get()
  findAll() {
    return this.audoRepaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.audoRepaymentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAudoRepaymentDto: UpdateAudoRepaymentDto,
  ) {
    return this.audoRepaymentsService.update(+id, updateAudoRepaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.audoRepaymentsService.remove(+id);
  }
}
