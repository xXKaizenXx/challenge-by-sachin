import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { LoanTableService } from './loan-table.service';
import { LoanTableDto } from './dto/loan-table.dto';
import { BaseResponseDto } from 'src/common/dtos/base-response.dto';
import { Auth } from 'src/decorators';
import { RoleType } from 'src/constants';

@ApiTags('loan-table')
@Controller('api/v1/loan-table/')
export class LoanTableController {
  constructor(private readonly loanTableService: LoanTableService) {}

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get()
  @ApiOkResponse({ type: BaseResponseDto })
  async getAll() {
    const data = await this.loanTableService.findAll();
    return BaseResponseDto.from(data);
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get(':id')
  @ApiOkResponse({ type: BaseResponseDto })
  @ApiNotFoundResponse({ description: 'LoanTable record not found' })
  async getById(@Param('id') id: string) {
    const data = await this.loanTableService.findOne(id);
    return BaseResponseDto.from(data);
  }
}
