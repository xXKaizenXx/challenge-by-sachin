import { Injectable } from '@nestjs/common';
import {
  GroupPackageEntity,
  GroupPackageStatus,
} from '../group-package/entities/group-package.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { StatusEntity } from '../status/entities/status.entity';
import { StatusEnum } from 'src/constants';

@Injectable()
export class DisbursementsService {
  constructor(private readonly dataSource: DataSource) {}

  async disburse(user: UserEntity) {
    try {
      return await this.dataSource.transaction(async (manager) => {
      // 1) Resolve statuses
      const [awaiting, active] = await Promise.all([
        manager.findOne(StatusEntity, {
          where: { name: StatusEnum.AWAITING_DISBURSEMENT },
        }),
        manager.findOne(StatusEntity, { where: { name: StatusEnum.ACTIVE } }),
      ]);
      if (!awaiting || !active) {
        throw new Error(
          'Required statuses are missing (Awaiting Disbursement / Active).',
        );
      }
      const updateResult = await manager
        .createQueryBuilder()
        .update(LoanEntity)
        .set({
          statusId: active.id,
          status: active.name,
          disbursementDate: () => 'NOW()', // DB-side timestamp
          disbursedById: user.id,
          disbursedByName: `${user.firstName} ${user.lastName}`,
        })
        .where('statusId = :sid', { sid: awaiting.id })
        .andWhere('CAST(expected_disbursement_date AS date) <= CURRENT_DATE')
        .returning(['id', 'groupPackageId'])
        .execute();
      const updated = (updateResult.raw || []) as Array<{
        id: string;
        groupPackageId: string | null;
      }>;
      if (!updated.length) {
        return [] as Array<{
          disbursement_date: string;
          names: string;
          bank_account_number: string;
          bank: string;
          branch_code: string;
          principal: string | number;
        }>;
      }
      const groupPackageIds = [
        ...new Set(updated.map((r) => r.groupPackageId).filter(Boolean)),
      ] as string[];
      
      if (groupPackageIds.length) {
        await manager
          .createQueryBuilder()
          .update(GroupPackageEntity)
          .set({ status: GroupPackageStatus.ACTIVE })
          .where('id IN (:...ids)', { ids: groupPackageIds })
          .execute();
      }

      // Also check for group packages that have all loans active but are still awaiting disbursement
      const awaitingGroupPackages = await manager
        .createQueryBuilder(GroupPackageEntity, 'gp')
        .leftJoin('gp.loans', 'l')
        .select(['gp.id'])
        .addSelect('COUNT(l.id)', 'totalLoans')
        .addSelect('COUNT(CASE WHEN l.status = :activeStatus THEN 1 END)', 'activeLoans')
        .where('gp.status = :awaitingStatus', { 
          awaitingStatus: GroupPackageStatus.AWAITING_DISBURSEMENT 
        })
        .setParameter('activeStatus', active.name)
        .groupBy('gp.id')
        .having('COUNT(l.id) > 0')
        .andHaving('COUNT(l.id) = COUNT(CASE WHEN l.status = :activeStatus THEN 1 END)')
        .getRawMany();

      if (awaitingGroupPackages.length > 0) {
        const packageIdsToActivate = awaitingGroupPackages.map(pkg => pkg.gp_id);
        await manager
          .createQueryBuilder()
          .update(GroupPackageEntity)
          .set({ status: GroupPackageStatus.ACTIVE })
          .where('id IN (:...ids)', { ids: packageIdsToActivate })
          .execute();
      }
      const loanIds = updated.map((r) => r.id);
      const rows = await manager
        .createQueryBuilder(LoanEntity, 'l')
        .innerJoin('l.client', 'c')
        .innerJoin('c.bank', 'b')
        // Use camelCase properties; naming strategy maps them to snake_case.
        .select('CAST("l"."disbursement_date" AS date)', 'disbursement_date')
        .addSelect("concat(c.firstName, ' ', c.lastName)", 'names')
        .addSelect('c.bankAccountNumber', 'bank_account_number')
        .addSelect('b.name', 'bank')
        .addSelect('b.branchCode', 'branch_code')
        .addSelect('l.principal', 'principal')
        .whereInIds(loanIds)
        .orderBy('"l"."disbursement_date"', 'ASC')
        .getRawMany<{
          disbursement_date: string;
          names: string;
          bank_account_number: string;
          bank: string;
          branch_code: string;
          principal: string | number;
        }>();
      return rows;
      });
    } catch (error) {
      throw error;
    }
  }
}
