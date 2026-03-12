import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger, // <-- Add this import
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import {
  PaymentMethod,
  TransactionEntity,
  TransactionType,
} from './entities/transaction.entity';
import { LoanScheduleService } from '../loan-schedule/loan-schedule.service';
import { LoanService } from '../loan/loan.service';
import { LoanScheduleStatus } from 'src/constants/loan-schedule-status';
import { UserEntity } from '../user/user.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { GroupPackageStatus } from '../group-package/entities/group-package.entity';
import { StatusEnum } from 'src/constants';
import { GroupPackageService } from '../group-package/group-package.service';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';


@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name); // <-- Add logger

  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    private loanScheduleService: LoanScheduleService,
    @InjectRepository(LoanScheduleEntity)
    private scheduleRepository: Repository<LoanScheduleEntity>,
    private loanService: LoanService,
    private groupPackageService: GroupPackageService,
    private dataSource: DataSource,
  ) { }

  async create(createTransactionDto: CreateTransactionDto, user: UserEntity) {
    this.logger.log(`Creating transaction for user ${user.id}`); // <-- Log entry

    const { repayments } = createTransactionDto;
    if (repayments.length < 1) {
      this.logger.warn('No repayments provided');
      throw new BadRequestException('No repayments provided');
    }

    // Support both single and multiple repayments
    if (repayments.length >= 1) {
      const transactions = [];
      for (const repayment of repayments) {
        this.logger.debug(`Processing repayment for schedule ${repayment.scheduleId}`);
        const schedule = await this.scheduleRepository.findOne({
          where: {
            id: repayment.scheduleId,
          },
          relations: ['loan'],
        });
        if (!schedule) {
          this.logger.error(`Schedule ${repayment.scheduleId} not found`);
          throw new NotFoundException('Schedule not found');
        }
        if (schedule.status === LoanScheduleStatus.PAID) {
          this.logger.warn(`Installment for schedule ${schedule.id} is already paid`);
          throw new BadRequestException('Installment is already paid');
        }
        const creditTransaction: Partial<TransactionEntity> = {
          transactionType: TransactionType.REPAYMENT,
          transactionDate: new Date(createTransactionDto.transactionDate),
          credit: repayment.amount,
          debit: 0,
          schedule: schedule,
          paymentMethod: PaymentMethod.BANK_TRANSFER, // Use correct enum value
          loan: schedule.loan,
          notes: 'loan repayment',
          collectedBy: user,
          collectedById: user.id,
        };
        if (repayment.amount > schedule.totalDue) {
          this.logger.warn(
            `Repayment amount (${repayment.amount}) is greater than total due (${schedule.totalDue}) for schedule ${schedule.id}`,
          );
          throw new BadRequestException(
            'Installment amount is greater than the total due',
          );
        }
        const { principalDue, interestDue, applicationFeeDue, serviceFeeDue } = schedule;
        const transaction = await this.transactionRepository.save(creditTransaction);
        this.logger.log(`Transaction ${transaction.id} saved for schedule ${schedule.id}`);
        const principalPaid = repayment.amount - interestDue - applicationFeeDue - serviceFeeDue;
        const totalPaid = parseFloat(repayment.amount?.toString()) + (parseFloat(schedule.totalPaid.toString()) || 0);
        const returnStatus = () => {
          if (totalPaid === 0) {
            return LoanScheduleStatus.PENDING;
          }
          if (totalPaid >= schedule.totalDue) {
            return LoanScheduleStatus.PAID;
          } else if (Math.ceil(totalPaid) < schedule.totalDue) {
            return LoanScheduleStatus.PARTIALLY_PAID;
          } else {
            return LoanScheduleStatus.PENDING;
          }
        };
        await this.loanScheduleService.update(schedule.id, {
          principalPaid: principalPaid,
          interestPaid: parseFloat((repayment.amount - applicationFeeDue - serviceFeeDue - principalDue).toFixed(7)),
          applicationFeePaid: repayment.amount - interestDue - principalDue - serviceFeeDue,
          serviceFeePaid: repayment.amount - principalDue - interestDue - applicationFeeDue,
          totalPaid: totalPaid,
          status: returnStatus(),
        });
        this.logger.log(`Loan schedule ${schedule.id} updated`);
        // If this is the 4th installment and is now fully paid, update loan and group package status
        if (schedule.installmentNumber === 4 && returnStatus() === LoanScheduleStatus.PAID) {
          // Update loan status to Completed
          if (schedule.loan) {
            await this.loanService.update(schedule.loan.id, { status: StatusEnum.Completed }, user);
            this.logger.log(`Loan ${schedule.loan.id} status updated to Completed`);
          }
          // Update group package status to Completed
          if (schedule.groupPackage) {
            await this.groupPackageService.update(
              schedule.groupPackage.id,
              { status: GroupPackageStatus.Completed },
              user
            );
            this.logger.log(`Group package ${schedule.groupPackage.id} status updated to Completed`);
          }
        }
        transactions.push(transaction);
      }
      this.logger.log(`Created ${transactions.length} transactions`);
      return transactions.length === 1 ? transactions[0] : transactions;
    }
  }

  async delete(id: string): Promise<void> {
    await this.transactionRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.transactionRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: any): Promise<{ data: TransactionEntity[]; meta: any }> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('tx')
      .withDeleted()
      .where('tx.deletedAt IS NOT NULL')
      .orderBy('tx.createdAt', pageOptionsDto.order ?? 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    const meta = { itemCount, pageOptionsDto };
    return { data, meta };
  }

  async reverseTransaction(dto: ReverseTransactionDto, user: UserEntity) {
    const { transactionId, reason } = dto;
    this.logger.log(`Starting reversal for transaction ${transactionId} by user ${user.id}`);

    const originalTx = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['schedule', 'loan', 'schedule.groupPackage'],
    });

    if (!originalTx) {
      this.logger.error(`Transaction ${transactionId} not found`);
      throw new NotFoundException('Transaction not found');
    }

    if (![TransactionType.REPAYMENT, TransactionType.DISBURSEMENT].includes(originalTx.transactionType)) {
      this.logger.warn(`Transaction ${transactionId} type ${originalTx.transactionType} cannot be reversed`);
      throw new BadRequestException('Only REPAYMENT and DISBURSEMENT transactions can be reversed');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Mark original transaction as zeroed
      originalTx.debit = 0;
      originalTx.credit = 0;
      originalTx.notes = `${reason}`;
      originalTx.collectedBy = user;
      originalTx.collectedById = user.id;
      originalTx.reversalTransaction = originalTx; // self-reference for zeroing
      originalTx.reversedBy = originalTx;    // self-reference, could be null or same
      await manager.save(originalTx);
      this.logger.log(`Transaction ${originalTx.id} zeroed with reversal fields populated`);

      // Reset loan schedule if exists
      if (originalTx.schedule) {
        const sched = originalTx.schedule;
        sched.principalPaid = 0;
        sched.interestPaid = 0;
        sched.totalPaid = 0;

        const today = new Date();
        const dueDate = new Date(sched.dueDate);
        if (dueDate < today) sched.status = LoanScheduleStatus.OVERDUE;
        else if (dueDate.toDateString() === today.toDateString()) sched.status = LoanScheduleStatus.DUE;
        else sched.status = LoanScheduleStatus.PENDING;

        await manager.save(sched);
        this.logger.log(`Loan schedule ${sched.id} reset with status ${sched.status}`);
      }

      // Reset loan
      if (originalTx.loan) {
        const loan = originalTx.loan;
        loan.status = StatusEnum.AWAITING_DISBURSEMENT;
        loan.disbursementDate = null;
        await manager.save(loan);
        this.logger.log(`Loan ${loan.id} reset to AWAITING_DISBURSEMENT`);
      }

      // Reset group package
      if (originalTx.schedule?.groupPackage) {
        const gp = originalTx.schedule.groupPackage;
        gp.status = GroupPackageStatus.AWAITING_DISBURSEMENT;
        await manager.save(gp);
        this.logger.log(`Group package ${gp.id} reset to AWAITING_DISBURSEMENT`);
      }

      return { message: `Transaction ${transactionId} zeroed and reversal fields populated` };
    });
  }

}
