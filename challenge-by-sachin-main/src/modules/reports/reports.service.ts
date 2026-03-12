import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanEntity } from '../loan/entities/loan.entity';
import { Repository } from 'typeorm';
import { addDays, format, subDays } from 'date-fns';
import {
  TransactionEntity,
  TransactionType,
} from '../transaction/entities/transaction.entity';

type DisbursementReportRow = {
  clientid: string;
  clientname: string;
  groupname: string;
  centername: string;
  amount: number;
  applicationfee: string;
  bankname: string;
  datedisbursed: string;
  nationalidnumber: string;
  loanofficer: string;
};

type RepaymentTransactionReport = {
  transactiondate: string;
  clientname: string;
  clientid: string;
  groupname: string;
  centername: string;
  amount: number;
  systemcode: string;
  grouppackageid: string;
  loanofficer: string;
  loanid: string;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LoanEntity)
    private loanRepository: Repository<LoanEntity>,
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  async generateDisbursementReport(query: {
    startDate: string;
    endDate: string;
  }) {
    const { startDate, endDate } = query;

    const endDatePlusOne = format(addDays(new Date(endDate), 1), 'yyyy-MM-dd');

    const sqlQuery = this.loanRepository
      .createQueryBuilder('loan')
      .innerJoinAndSelect('loan.client', 'client')
      .innerJoinAndSelect('client.group', 'group')
      .innerJoinAndSelect('client.center', 'center')
      .innerJoinAndSelect('client.bank', 'bank')
      .select([
        'client.id AS clientId',
        "CONCAT(client.firstName, ' ', client.lastName) AS clientName",
        'group.name AS groupName',
        'center.name AS centerName',
        'loan.principal AS amount',
        'loan.applicationFee AS applicationFee',
        'bank.name AS bankName',
        'loan.disbursement_date::date AS dateDisbursed',
        'client.nationalIdNumber AS nationalIdNumber',
        'loan.userName AS loanOfficer',
      ])
      .where('loan.disbursementDate IS NOT NULL')
      .andWhere('loan.disbursementDate >= :startDate', { startDate })
      .andWhere('loan.disbursementDate <= :endDate', { endDate })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: ['Active', 'Closed', 'Written Off', 'Completed'],
      })
      .orderBy('loan.disbursementDate', 'ASC');

    const disbursements = await sqlQuery.getRawMany<DisbursementReportRow>();

    console.log('DISBURSEMENTS FETCHED:', disbursements?.length);

    if (disbursements.length === 0) {
      throw new Error('No disbursements found for the given date range');
    }

    return disbursements;
  }

  async generateRepaymentsReport(query: {
    startDate: string;
    endDate: string;
  }) {
    const { startDate, endDate } = query;

    console.log('QUERIES: ', query);

    const repayments = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.loan', 'l')
      .innerJoin('l.client', 'c')
      .leftJoin('l.group', 'g')
      .leftJoin('c.center', 'center')
      .leftJoin('l.groupPackage', 'gp')
      .leftJoin('l.staff', 'loanOfficer')
      .where('t.transactionType = :type', { type: TransactionType.REPAYMENT })
      .andWhere('t.transactionDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .select([
        't.transactionDate AS transactionDate',
        "CONCAT(c.firstName, ' ', c.lastName) AS clientName",
        'c.id AS clientId',
        'g.name AS groupName',
        'center.name AS centerName',
        't.credit AS amount', // repayment value
        'g.systemName AS systemCode',
        'gp.id AS groupPackageId',
        "CONCAT(loanOfficer.firstName, ' ', loanOfficer.lastName) AS loanOfficer",
        'l.id AS loanId',
      ])
      .orderBy('t.transactionDate', 'DESC')
      .getRawMany<RepaymentTransactionReport>();

    if (repayments.length === 0) {
      throw new NotFoundException(
        'No repayments found for the given date range',
      );
    }
    return repayments;
  }
}
