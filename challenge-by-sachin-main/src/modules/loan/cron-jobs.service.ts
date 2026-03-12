import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { LoanScheduleStatus } from 'src/constants/loan-schedule-status';
import { StatusEnum } from 'src/constants/constants';
import { StatusEntity } from '../status/entities/status.entity';

@Injectable()
export class CronJobsService {
  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
    @InjectRepository(LoanScheduleEntity)
    private readonly loanScheduleRepository: Repository<LoanScheduleEntity>,
    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
    private readonly dataSource: DataSource, // 👈 Nest will inject it
  ) {}
  private readonly logger = new Logger(CronJobsService.name);

  //make the cron job to run every day at 12:00 AM to check if the loan is overdue and if it is, then update the loan status to overdue
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Africa/Lusaka' })
  async handleCron() {
    try {
      console.log('CRON JOB RUNNING');
      const res = await this.markLoansAsDueOrOverdue();
      console.log('LOANS MARKED AS DUE OR OVERDUE', res);
      this.logger.log(`Loans marked as due or overdue: ${res}`);
    } catch (error) {
      console.log('ERROR MARKING LOANS AS DUE OR OVERDUE', error);
      this.logger.error(`Error marking loans as due or overdue: ${error}`);
    }
  }

  async markLoansAsDueOrOverdue() {
    // 0) Load statuses and validate all exist
    console.log('CRON JOB RUNNING');
    const [activeStatus, dueStatus, overdueStatus, closedStatus] =
      await Promise.all([
        this.statusRepository.findOne({ where: { name: StatusEnum.ACTIVE } }),
        this.statusRepository.findOne({
          where: { name: LoanScheduleStatus.DUE },
        }),
        this.statusRepository.findOne({
          where: { name: LoanScheduleStatus.OVERDUE },
        }),
        this.statusRepository.findOne({ where: { name: StatusEnum.CLOSED } }),
      ]);
    if (!activeStatus || !dueStatus || !overdueStatus || !closedStatus) {
      throw new Error('One or more statuses not found');
    }
    console.log('ACTIVE STATUS', activeStatus);
    console.log('DUE STATUS', dueStatus);
    console.log('OVERDUE STATUS', overdueStatus);
    console.log('CLOSED STATUS', closedStatus);
    // Define day boundaries in DB/server timezone
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // 1) Get active loans (use correct alias)
    const loans = await this.loanRepository
      .createQueryBuilder('loans')
      .where('loans.statusId = :statusId', { statusId: activeStatus.id })
      .getMany();

    console.log('ACTIVE LOANS', loans);

    // 2) Preload all pending schedules for these loans (N in one go)
    const loanIds = loans.map((l) => l.id);
    if (loanIds.length === 0) return;

    const schedules = await this.loanScheduleRepository.find({
      where: { loanId: In(loanIds), status: LoanScheduleStatus.PENDING },
    });
    console.log('PENDING SCHEDULES', schedules);
    // Helper for money-safe compare (convert to integer minor units if you can)
    const lt = (paid: number, due: number) => paid + 0.000001 < due; // temporary guard
    const gte = (paid: number, due: number) => paid + 0.000001 >= due;

    // 3) Update schedules in memory first
    const byLoan = new Map<string, typeof schedules>();
    for (const s of schedules) {
      const arr = byLoan.get(s.loanId) ?? [];
      arr.push(s);
      byLoan.set(s.loanId, arr);

      const due = new Date(s.dueDate);
      const isToday = due >= startOfToday && due <= endOfToday;

      if (isToday && lt(s.totalPaid, s.totalDue)) {
        s.status = LoanScheduleStatus.DUE;
      } else if (due < startOfToday && lt(s.totalPaid, s.totalDue)) {
        s.status = LoanScheduleStatus.OVERDUE;
      } else if (gte(s.totalPaid, s.totalDue)) {
        s.status = LoanScheduleStatus.PAID;
        // optional: handle OVERPAYMENT if (paid > due)
      } // else leave as PENDING
    }

    // 4) Derive loan statuses with priority
    const updatesForLoans: any[] = [];
    for (const loan of loans) {
      const ls = byLoan.get(loan.id) ?? [];

      const anyOverdue = ls.some(
        (s) => s.status === LoanScheduleStatus.OVERDUE,
      );
      const anyDue =
        !anyOverdue && ls.some((s) => s.status === LoanScheduleStatus.DUE);
      const allPaid =
        ls.length > 0 && ls.every((s) => s.status === LoanScheduleStatus.PAID);

      if (anyOverdue) {
        loan.statusId = overdueStatus.id;
        loan.status = StatusEnum.OVERDUE as any; // ensure this matches your Loan status enum
      } else if (anyDue) {
        loan.statusId = dueStatus.id;
        loan.status = StatusEnum.DUE as any;
      } else if (allPaid) {
        loan.statusId = closedStatus.id;
        loan.status = StatusEnum.CLOSED as any;
      } else {
        // remain ACTIVE
        loan.statusId = activeStatus.id;
        loan.status = StatusEnum.ACTIVE as any;
      }
      updatesForLoans.push(loan);
    }

    // 5) Persist in a transaction & batch
    await this.dataSource.transaction(async (manager) => {
      console.log('SCHEDULES', schedules);
      if (schedules.length) {
        await manager
          .getRepository(LoanScheduleEntity)
          .save(schedules, { chunk: 500 });
      }
      if (updatesForLoans.length) {
        await manager
          .getRepository(LoanEntity)
          .save(updatesForLoans, { chunk: 500 });
      }
    });
  }
}
