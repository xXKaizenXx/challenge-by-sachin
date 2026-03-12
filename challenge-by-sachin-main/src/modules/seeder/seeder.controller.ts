import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeederService } from './seeder.service';
import { Auth } from 'src/decorators';
import { RoleType } from 'src/constants';

@ApiTags('Seeder')
@Controller('api/v1/seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  // @Auth([RoleType.IT])
  @Post('/seed-6-month-loan-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed loan products' })
  @ApiResponse({ status: 200, description: 'Loan products seeded successfully.' })
  async seed6MonthsLoanTable() {
    const message = await this.seederService.seed6MonthsLoanTable();
    return { message };
  }

  @Post('/seed-center-loans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start seeder' })
  @ApiResponse({ status: 200, description: 'Seeder started successfully.' })
  async getSeeder(@Param('id') id: string): Promise<{ message: string }> {
    await this.seederService.seed(id);
    return { message: 'seeder started' };
  }

  @Post('/seed-meeting-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed meeting data' })
  @ApiResponse({
    status: 200,
    description: 'Meeting data seeded successfully.',
  })
  async seedMeetingData() {
    const results = await this.seederService.seedMeetingDaysData();
    return { data: results };
  }

  //seed provinces
  @Post('/seed-provinces')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed provinces' })
  @ApiResponse({ status: 200, description: 'Provinces seeded successfully.' })
  async seedProvinces() {
    const results = await this.seederService.seedProvinces();
    return { data: results };
  }

  //seed languages
  @Post('/seed-languages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed languages' })
  @ApiResponse({ status: 200, description: 'Languages seeded successfully.' })
  async seedLanguages() {
    const results = await this.seederService.seedLanguages();
    return { data: results };
  }

  //seed all data
  @Post('/seed-all-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed all data' })
  @ApiResponse({ status: 200, description: 'All data seeded successfully.' })
  async seedAllData() {
    const results = await this.seederService.seedAllData();
    return { data: results };
  }

  //sed head office
  @Post('/seed-head-office')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed head office' })
  @ApiResponse({ status: 200, description: 'Head office seeded successfully.' })
  async seedHeadOffice() {
    const results = await this.seederService.seedHeadOffice();
    return { data: results };
  }

  //seed loan table
  @Post('/seed-loan-table')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed loan table' })
  @ApiResponse({ status: 200, description: 'Loan table seeded successfully.' })
  async seedLoanTable() {
    const results = await this.seederService.seedLoanTable();
    return { data: results };
  }

  //seed super user
  @Post('/seed-super-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed super user' })
  @ApiResponse({ status: 200, description: 'Super user seeded successfully.' })
  async seedSuperUser() {
    const results = await this.seederService.seedSuperUser();
    return { data: results };
  }

  //seed loans
  @Post('/seed-array-of-loans')
  @HttpCode(HttpStatus.OK)
  async seedLoans() {
    await this.seederService.seedLoans();
    return { message: 'seeding started' };
  }
}
