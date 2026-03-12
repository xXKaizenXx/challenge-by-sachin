import {
  Controller,
  Get,
  Request,
  Response,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { format } from '@fast-csv/format';
import { format as dateFormat } from 'date-fns';
import { Auth } from 'src/decorators';
import { RoleType } from 'src/constants';
import { json } from 'stream/consumers';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('disbursements')
  async getDisbursementsReportCsv(
    @Request() req,
    @Response() res,
    @Query() queries: { startDate: string; endDate: string },
  ) {
    if (!queries?.endDate || !queries?.endDate)
      throw new BadRequestException('startDate and endDate are required');
    const { startDate, endDate } = queries;

    console.log(
      'Generating disbursements report from',
      startDate,
      'to',
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="disbursements-${startDate}-${endDate}.csv"`,
    );

    try {
      console.log('DISBURSEMENTS REPORT CONTROLLER PROCESSING STARTED');
      const rows = await this.reportsService.generateDisbursementReport(
        queries,
      );
      console.log('DISBURSEMENTS REPORT CONTROLLER PROCESSING COMPLETED');
      const csv = format({
        headers: [
          'Client Id',
          'Client Name',
          'Group',
          'Center',
          'Amount',
          'Application Fee',
          'Bank Name',
          'Loan Officer',
          'Date Disbursed',
          'National Id Number',
        ],
      });
      console.log('CSV FORMAT CREATED');
      csv.on('error', (err) => {
        // Optional: log error
        res.status(500);
        res.end();
      });
      csv.pipe(res);
      console.log('CSV FORMAT PIPED');
      for (const r of rows) {
        csv.write({
          'Client Id': r.clientid,
          'Client Name': r.clientname,
          Group: r.groupname,
          Center: r.centername,
          Amount: r.amount,
          'Application Fee': r.applicationfee,
          'Bank Name': r.bankname,
          'Loan Officer': r.loanofficer,
          'Date Disbursed': dateFormat(new Date(r.datedisbursed), 'yyyy-MM-dd'),
          'National Id Number': r.nationalidnumber.toString(),
        });
      }
      csv.end();
      console.log('CSV FORMAT ENDED 1');
    } catch (error) {
      console.log('CSV FORMAT ENDED 2', error);
      res.status(400).send(error?.message || 'Failed to generate CSV.');
    }
  }

  // @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('repayments')
  async getRepaymentsReportCsv(
    @Request() req,
    @Response() res,
    @Query() queries: { startDate: string; endDate: string },
  ) {
    if (!queries?.endDate || !queries?.endDate)
      throw new BadRequestException('startDate and endDate are required');
    const { startDate, endDate } = queries;

    console.log('Generating repayments report from', startDate, 'to', endDate);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="repayments-${startDate}-${endDate}.csv"`,
    );

    try {
      console.log('REPAYMENTS REPORT CONTROLLER PROCESSING STARTED');
      const rows = await this.reportsService.generateRepaymentsReport(queries);
      console.log('REPAYMENTS REPORT CONTROLLER PROCESSING COMPLETED');
      const csv = format({
        headers: [
          'Date',
          'Client Name',
          'Amount',
          'Reference',
          'Group',
          'Center',
          'Loan Officer',
          'Package Id',
          'Loan Id',
        ],
      });
      console.log('CSV FORMAT CREATED');
      csv.on('error', (err) => {
        console.log('csvg', err);

        // Optional: log error
        res.status(500);
        res.end();
      });
      csv.pipe(res);
      console.log('CSV FORMAT PIPED');
      for (const r of rows) {
        csv.write({
          'Client Id': r?.clientid,
          'Client Name': r?.clientname,
          Group: r?.groupname,
          Center: r?.centername,
          Amount: r?.amount,
          Reference: r?.systemcode,
          'Package Id': r?.grouppackageid,
          'Loan Officer': r?.loanofficer,
          Date: dateFormat(new Date(r?.transactiondate), 'yyyy-MM-dd'),
          'Loan Id': r?.loanid,
        });
      }
      csv.end();
      console.log('CSV FORMAT ENDED 1');
    } catch (error) {
      console.log('CSV FORMAT ENDED 2', error);
      res
        .status(error?.response?.statusCode || 400)
        .send(error?.message || 'Failed to generate CSV.');
    }
  }
}
