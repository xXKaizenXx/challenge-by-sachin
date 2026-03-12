import { Controller, Post, Request, Response } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { format } from '@fast-csv/format';
import { Auth } from 'src/decorators';
import { RoleType } from 'src/constants';

@Controller('api/v1/disbursements')
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) {}

  @Post('/disburse')
  @Auth([RoleType.SUPER_USER])
  async getDisbusrementsCsv(@Request() req, @Response() res) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="disbursements.csv"',
    );

    try {
      console.log('DISBURSEMENTS CONTROLLER PROCESSING STARTED');
      const rows = await this.disbursementsService.disburse(req.user);
      console.log('DISBURSEMENTS CONTROLLER PROCESSING COMPLETED');
      const csv = format({
        headers: [
          'Disbursement Date',
          'Name',
          'Bank Account',
          'Bank Name',
          'Branch Code',
          'Amount',
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
          'Disbursement Date': r.disbursement_date, // already ::date in SQL
          Name: r.names,
          'Bank Account': r.bank_account_number,
          'Bank Name': r.bank,
          'Branch Code': r.branch_code,
          Amount: r.principal,
        });
      }
      csv.end();
      console.log('CSV FORMAT ENDED 1');
    } catch (error) {
      console.log('CSV FORMAT ENDED 2', error);
      res
        .status(500)
        .send('Failed to generate CSV. It will me emailed to you.');
    }
  }
}
